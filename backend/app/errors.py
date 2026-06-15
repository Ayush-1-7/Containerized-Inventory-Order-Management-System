"""Domain exceptions and global handlers producing a uniform JSON envelope.

Every error response has the shape:
    {"error": {"code": <int>, "type": <str>, "message": <str>, "details": <any>}}
"""
from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    status_code = status.HTTP_400_BAD_REQUEST
    error_type = "app_error"

    def __init__(self, message: str, details=None):
        self.message = message
        self.details = details
        super().__init__(message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    error_type = "not_found"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    error_type = "conflict"


class BusinessRuleError(AppError):
    """Unprocessable request — e.g. insufficient stock."""

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_type = "business_rule_violation"


def _envelope(code: int, error_type: str, message: str, details=None) -> JSONResponse:
    return JSONResponse(
        status_code=code,
        content={
            "error": {
                "code": code,
                "type": error_type,
                "message": message,
                "details": jsonable_encoder(details),
            }
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        return _envelope(exc.status_code, exc.error_type, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        return _envelope(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "validation_error",
            "Request validation failed.",
            exc.errors(),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException):
        return _envelope(exc.status_code, "http_error", str(exc.detail))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        return _envelope(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "internal_error",
            "An unexpected error occurred.",
        )
