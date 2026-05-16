from abc import ABC, abstractmethod

from app.models.job import Job


class BaseProvider(ABC):
    name: str = ""

    @abstractmethod
    def submit(self, job: Job) -> Job:
        """Submit generation job. Set status to queued/processing and return."""
        ...

    @abstractmethod
    def poll(self, job: Job) -> Job:
        """Check provider for status update. Return updated job."""
        ...

    def submit_generation(self, job: Job) -> Job:
        """Standardized pipeline entry point for submit."""
        return self.submit(job)

    def poll_generation(self, job: Job) -> Job:
        """Standardized pipeline entry point for poll."""
        return self.poll(job)

    def download_result(self, job: Job) -> Job:
        """Download and save provider result files locally. Override in real providers."""
        return job

    def normalize_result(self, raw: dict) -> dict:
        """Normalize raw provider API response to MiniMesh standard format."""
        return raw
