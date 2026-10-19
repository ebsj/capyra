"""Domain errors for the short-video analysis pipeline."""


class CapyraAnalyticError(Exception):
    """Base error for the application."""


class ConfigurationError(CapyraAnalyticError):
    """Raised when required configuration is missing or invalid."""


class InvalidShortVideoUrlError(CapyraAnalyticError):
    """Raised when the provided URL is not a supported public short-video URL."""


class InvalidUploadedVideoError(CapyraAnalyticError):
    """Raised when the provided uploaded video is missing or invalid."""


class ShortVideoDownloadError(CapyraAnalyticError):
    """Raised when the short video cannot be downloaded."""

    def __init__(self, message: str, *, details: dict[str, object] | None = None) -> None:
        super().__init__(message)
        self.details = details


class ExternalDependencyError(CapyraAnalyticError):
    """Raised when a required external binary is missing."""


class MediaProcessingError(CapyraAnalyticError):
    """Raised when ffmpeg/ffprobe processing fails."""


class OpenAIAnalysisError(CapyraAnalyticError):
    """Raised when transcription or multimodal analysis fails."""


class WorkspaceError(CapyraAnalyticError):
    """Raised when local upload/workspace storage cannot be read or written."""
