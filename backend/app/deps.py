"""FastAPI dependencies: repositories and services."""

from typing import Annotated

from fastapi import Depends

from app.repositories import (
    MerchantRepository,
    TransactionRepository,
    DebtRepository,
)
from app.services.webhook_service import WebhookService


def get_merchant_repo() -> MerchantRepository:
    return MerchantRepository()


def get_transaction_repo() -> TransactionRepository:
    return TransactionRepository()


def get_debt_repo() -> DebtRepository:
    return DebtRepository()


def get_webhook_service() -> WebhookService:
    return WebhookService()


# Type aliases for use in route signatures
MerchantRepo = Annotated[MerchantRepository, Depends(get_merchant_repo)]
TransactionRepo = Annotated[TransactionRepository, Depends(get_transaction_repo)]
DebtRepo = Annotated[DebtRepository, Depends(get_debt_repo)]
WebhookSvc = Annotated[WebhookService, Depends(get_webhook_service)]
