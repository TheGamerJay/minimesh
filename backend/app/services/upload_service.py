import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.models.upload import ImageMeta, MetadataUpdate, VALID_ROLES
from app.services.project_context import PROJECT_ROOT, get_uploads_dir

# Keep PROJECT_ROOT exported so other services can import it (backward-compat)
__all__ = ["PROJECT_ROOT", "get_images", "save_images", "delete_image", "update_image_metadata"]

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp"}
EXT_TO_CONTENT_TYPE = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}
MAX_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
MAX_IMAGES = 20


def _uploads() -> Path:
    d = get_uploads_dir()
    d.mkdir(parents=True, exist_ok=True)
    return d


def _read_meta(json_path: Path) -> ImageMeta:
    return ImageMeta.model_validate_json(json_path.read_text(encoding="utf-8"))


def _write_meta(image_id: str, meta: ImageMeta) -> None:
    (_uploads() / f"{image_id}.json").write_text(meta.model_dump_json(), encoding="utf-8")


def _read_all_metadata() -> list[ImageMeta]:
    d = get_uploads_dir()
    if not d.exists():
        return []
    items: list[ImageMeta] = []
    for json_file in d.glob("*.json"):
        try:
            items.append(_read_meta(json_file))
        except Exception:
            pass
    items.sort(key=lambda m: m.uploaded_at, reverse=True)
    return items


async def save_images(files: list[UploadFile]) -> list[ImageMeta]:
    uploads_dir = _uploads()
    existing = _read_all_metadata()
    if len(existing) + len(files) > MAX_IMAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Upload would exceed the {MAX_IMAGES}-image limit. "
                   f"You currently have {len(existing)} image(s).",
        )

    results: list[ImageMeta] = []

    for file in files:
        original_name = file.filename or "image"
        ext = Path(original_name).suffix.lower()

        content_type = file.content_type or ""
        if content_type not in ALLOWED_CONTENT_TYPES:
            resolved = EXT_TO_CONTENT_TYPE.get(ext)
            if not resolved:
                raise HTTPException(
                    status_code=400,
                    detail=f"'{original_name}' is not an allowed type. "
                           "Accepted: PNG, JPG, JPEG, WEBP.",
                )
            content_type = resolved

        if ext not in EXT_TO_CONTENT_TYPE:
            ext = {
                "image/png": ".png",
                "image/jpeg": ".jpg",
                "image/webp": ".webp",
            }.get(content_type, ".jpg")

        data = await file.read()

        if len(data) == 0:
            raise HTTPException(status_code=400, detail=f"'{original_name}' is empty.")

        if len(data) > MAX_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"'{original_name}' exceeds the 25 MB size limit.",
            )

        image_id = str(uuid.uuid4())
        stored_filename = f"{image_id}{ext}"

        (uploads_dir / stored_filename).write_bytes(data)

        meta = ImageMeta(
            id=image_id,
            filename=original_name,
            url=f"/uploads/{stored_filename}",
            size=len(data),
            content_type=content_type,
            uploaded_at=datetime.now(timezone.utc).isoformat(),
        )
        _write_meta(image_id, meta)
        results.append(meta)

    return results


def get_images() -> list[ImageMeta]:
    _uploads()
    return _read_all_metadata()


def delete_image(image_id: str) -> None:
    uploads_dir = _uploads()
    meta_path = uploads_dir / f"{image_id}.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")

    meta = _read_meta(meta_path)
    image_path = uploads_dir / Path(meta.url).name
    if image_path.exists():
        image_path.unlink()

    meta_path.unlink()


def update_image_metadata(image_id: str, update: MetadataUpdate) -> ImageMeta:
    uploads_dir = _uploads()
    meta_path = uploads_dir / f"{image_id}.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")

    meta = _read_meta(meta_path)

    if update.reference_role is not None:
        if update.reference_role not in VALID_ROLES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid reference_role '{update.reference_role}'. "
                       f"Allowed: {', '.join(sorted(VALID_ROLES))}",
            )
        meta.reference_role = update.reference_role

    if update.notes is not None:
        meta.notes = update.notes

    if update.is_primary is not None:
        meta.is_primary = update.is_primary
        if update.is_primary:
            target_role = meta.reference_role
            for other_path in uploads_dir.glob("*.json"):
                if other_path.stem == image_id:
                    continue
                try:
                    other = _read_meta(other_path)
                    if other.is_primary and other.reference_role == target_role:
                        other.is_primary = False
                        _write_meta(other.id, other)
                except Exception:
                    pass

    _write_meta(image_id, meta)
    return meta
