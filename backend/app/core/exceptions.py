"""Application-specific exceptions for consistent error handling."""


class AppError(Exception):
    """Base exception for application errors."""

    def __init__(self, message: str, code: str = "APP_ERROR") -> None:
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundError(AppError):
    """Resource not found (e.g. merchant, transaction)."""

    def __init__(self, resource: str, identifier: str) -> None:
        super().__init__(f"{resource} not found: {identifier}", code="NOT_FOUND")
        self.resource = resource
        self.identifier = identifier


class ExternalServiceError(AppError):
    """Failure calling external service (LLM, DB, Twilio)."""

    def __init__(self, service: str, message: str) -> None:
        super().__init__(message, code="EXTERNAL_SERVICE_ERROR")
        self.service = service
