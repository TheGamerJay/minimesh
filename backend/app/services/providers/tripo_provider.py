from __future__ import annotations
from app.services.providers.base import BaseProvider
from app.models.job import Job


class TripoProvider(BaseProvider):
    name = "tripo"

    def submit(self, job: Job) -> Job:
        raise NotImplementedError("Tripo3D is a stub provider — full integration coming in a future phase.")

    def poll(self, job: Job) -> Job:
        raise NotImplementedError("Tripo3D is a stub provider — full integration coming in a future phase.")
