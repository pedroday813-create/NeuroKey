class MindDriveError(Exception):
    """Base exception."""


class OfflineError(MindDriveError):
    pass


class AuthenticationError(MindDriveError):
    pass


class RateLimitError(MindDriveError):
    pass


class SafetyBlockedError(MindDriveError):
    pass
