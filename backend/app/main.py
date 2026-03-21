from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging_config import configure_logging, get_logger
from app.core.auth import require_api_key
from app.core.exceptions import AppError, NotFoundError
from app.core.middleware import SecurityHeadersMiddleware, RequestSizeLimitMiddleware
from app.routes import webhook, merchants, transactions, reports, payments, whatsapp_auth

load_dotenv()
logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate config and configure logging on startup."""
    configure_logging()

    if not settings.is_db_configured():
        logger.error("SUPABASE_URL and SUPABASE_KEY are required; API data endpoints will fail")
    if not settings.is_llm_configured():
        logger.warning("GEMINI_API_KEY not set; WhatsApp parsing will fail until set")
    if not settings.is_webhook_configured():
        logger.warning("Twilio credentials not set; webhook will not send replies")

    # Production safety checks
    if settings.app_env == "production":
        if not settings.dashboard_api_key:
            logger.error("DASHBOARD_API_KEY not set in production — API endpoints are unprotected!")
        if settings.cors_origins.strip() == "*":
            logger.error("CORS_ORIGINS is wildcard (*) in production — restrict to your frontend domain!")

    logger.info("SMB Bookkeeper API starting (env=%s)", settings.app_env)
    yield
    logger.info("Shutdown")


app = FastAPI(
    title="SMB Bookkeeper API",
    version="1.0.0",
    lifespan=lifespan,
    # Hide docs in production
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
    openapi_url="/openapi.json" if settings.app_env != "production" else None,
)

# Security middleware (outermost = applied first on response)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_size=1_048_576)  # 1MB

# Rate limiting: 60 req/min default, protects Gemini API costs
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restrict in production
cors_origins = settings.get_cors_origins_list()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"detail": exc.message, "code": exc.code},
    )


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": exc.message, "code": exc.code},
    )


# Public routes (webhook has its own Twilio signature auth)
app.include_router(webhook.router, tags=["WhatsApp"])
# Paystack webhook must stay public (signature-verified separately)
app.include_router(payments.router, prefix="/api", tags=["Payments"])
# WhatsApp OTP auth (public — handles its own verification)
app.include_router(whatsapp_auth.router, prefix="/api/auth", tags=["WhatsApp Auth"])

# Protected dashboard routes — require API key
app.include_router(merchants.router, prefix="/api", tags=["Merchants"], dependencies=[Depends(require_api_key)])
app.include_router(transactions.router, prefix="/api", tags=["Transactions"], dependencies=[Depends(require_api_key)])
app.include_router(reports.router, prefix="/api", tags=["Reports"], dependencies=[Depends(require_api_key)])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "smb-bookkeeper"}
