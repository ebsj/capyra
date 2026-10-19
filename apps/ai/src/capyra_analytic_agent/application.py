"""Shared application layer for HTTP adapters and internal callers."""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ConfigDict

from .config import AppConfig
from .errors import (
    CapyraAnalyticError,
    ConfigurationError,
    ExternalDependencyError,
    InvalidUploadedVideoError,
    InvalidShortVideoUrlError,
    MediaProcessingError,
    OpenAIAnalysisError,
    ShortVideoDownloadError,
    WorkspaceError,
)
from .models import ShortVideoAnalysisReport
from .service import ShortVideoAnalysisService


@dataclass(slots=True)
class AnalyzeVideoCommand:
    """Normalized analysis request shared by transport adapters."""

    source_type: str = "public_url"
    analysis_id: str | None = None
    source_label: str | None = None
    video_url: str | None = None
    upload_path: Path | None = None
    language: str = "pt-BR"
    selected_skill_ids: list[str] | None = None
    catalog_version: str | None = None
    intent: str | None = None
    keep_artifacts: bool = False
    artifact_root: Path | None = None
    timeout: int | None = None


class ErrorBody(BaseModel):
    """Serializable error metadata exposed by the application layer."""

    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    details: dict[str, Any] | None = None


class AppError(BaseModel):
    """Normalized application error for API handling."""

    model_config = ConfigDict(extra="forbid")

    status_code: int
    error: ErrorBody


class AnalysisApplication:
    """Small application service that bootstraps config and executes analysis."""

    def __init__(
        self,
        *,
        config_loader=AppConfig.from_env,
        service_factory=ShortVideoAnalysisService,
    ) -> None:
        self._config_loader = config_loader
        self._service_factory = service_factory

    def analyze(self, command: AnalyzeVideoCommand) -> ShortVideoAnalysisReport:
        """Run the analysis with a shared bootstrap path."""
        config = self._config_loader()
        if command.timeout is not None:
            config = config.model_copy(update={"request_timeout_seconds": command.timeout})

        service = self._service_factory(config)
        return service.analyze(
            source_type=command.source_type,
            source_label=command.source_label,
            video_url=command.video_url,
            upload_path=command.upload_path,
            language=command.language,
            selected_skill_ids=command.selected_skill_ids,
            catalog_version=command.catalog_version,
            intent=command.intent,
            keep_artifacts=command.keep_artifacts,
            artifact_root=command.artifact_root,
        )


def serialize_report(report: ShortVideoAnalysisReport) -> str:
    """Serialize the final report to the stable JSON transport form."""
    return json.dumps(report.model_dump(mode="json"), ensure_ascii=False, indent=2)


def translate_error(exc: Exception) -> AppError:
    """Map domain exceptions to structured transport-safe errors."""
    if isinstance(exc, InvalidShortVideoUrlError):
        return AppError(
            status_code=400,
            error=ErrorBody(code="invalid_short_video_url", message=str(exc)),
        )

    if isinstance(exc, InvalidUploadedVideoError):
        return AppError(
            status_code=400,
            error=ErrorBody(code="invalid_uploaded_video", message=str(exc)),
        )

    if isinstance(exc, ConfigurationError):
        return AppError(
            status_code=400,
            error=ErrorBody(code="configuration_error", message=str(exc)),
        )

    if isinstance(exc, ShortVideoDownloadError):
        return AppError(
            status_code=424,
            error=ErrorBody(
                code="media_pipeline_error",
                message=str(exc),
                details=exc.details,
            ),
        )

    if isinstance(exc, (ExternalDependencyError, MediaProcessingError, WorkspaceError)):
        return AppError(
            status_code=424,
            error=ErrorBody(code="media_pipeline_error", message=str(exc)),
        )

    if isinstance(exc, (TimeoutError, subprocess.TimeoutExpired)):
        return AppError(
            status_code=424,
            error=ErrorBody(code="media_pipeline_error", message="Media processing timed out."),
        )

    if isinstance(exc, OpenAIAnalysisError):
        return AppError(
            status_code=502,
            error=ErrorBody(code="openai_analysis_error", message=str(exc)),
        )

    if isinstance(exc, CapyraAnalyticError):
        return AppError(
            status_code=500,
            error=ErrorBody(code="capyra_analytic_error", message=str(exc)),
        )

    return AppError(
        status_code=500,
        error=ErrorBody(code="internal_server_error", message="Internal server error."),
    )
