from __future__ import annotations
from app.services.providers.base import BaseProvider
from app.models.job import Job


class RodinProvider(BaseProvider):
    name = "rodin"

    def submit(self, job: Job) -> Job:
        raise NotImplementedError("Rodin is a stub provider — full integration coming in a future phase.")

    def poll(self, job: Job) -> Job:
        raise NotImplementedError("Rodin is a stub provider — full integration coming in a future phase.")
