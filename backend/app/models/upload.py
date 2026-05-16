from pydantic import BaseModel

VALID_ROLES: set[str] = {
    "unassigned",
    "front_view",
    "back_view",
    "side_view",
    "material_reference",
    "weapon_reference",
    "armor_reference",
    "helmet_reference",
    "environment_reference",
    "other",
}


class ImageMeta(BaseModel):
    id: str
    filename: str
    url: str
    size: int
    content_type: str
    uploaded_at: str
    reference_role: str = "unassigned"
    notes: str = ""
    is_primary: bool = False


class MetadataUpdate(BaseModel):
    reference_role: str | None = None
    notes: str | None = None
    is_primary: bool | None = None


class MetadataResponse(BaseModel):
    success: bool
    image: ImageMeta


class UploadResponse(BaseModel):
    success: bool
    images: list[ImageMeta]


class ListResponse(BaseModel):
    success: bool
    images: list[ImageMeta]


class DeleteResponse(BaseModel):
    success: bool
