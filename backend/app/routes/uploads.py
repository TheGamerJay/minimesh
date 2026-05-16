from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.upload import (
    DeleteResponse,
    ListResponse,
    MetadataResponse,
    MetadataUpdate,
    UploadResponse,
)
from app.services.upload_service import (
    delete_image,
    get_images,
    save_images,
    update_image_metadata,
)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("/images", response_model=UploadResponse)
async def upload_images(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")
    images = await save_images(files)
    return UploadResponse(success=True, images=images)


@router.get("/images", response_model=ListResponse)
async def list_images():
    images = get_images()
    return ListResponse(success=True, images=images)


@router.patch("/images/{image_id}/metadata", response_model=MetadataResponse)
async def patch_image_metadata(image_id: str, body: MetadataUpdate):
    image = update_image_metadata(image_id, body)
    return MetadataResponse(success=True, image=image)


@router.delete("/images/{image_id}", response_model=DeleteResponse)
async def remove_image(image_id: str):
    delete_image(image_id)
    return DeleteResponse(success=True)
