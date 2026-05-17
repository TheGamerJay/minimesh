from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app.models.export_v2 import AssetExportPackage, ExportPackageRequest
from app.services import export_package_service

router = APIRouter(prefix="/api/export-v2", tags=["export-v2"])


@router.post("/create", response_model=AssetExportPackage, status_code=201)
def create_export_package(req: ExportPackageRequest):
    try:
        return export_package_service.create_package(
            req.asset_id, req.export_type, req.version_label
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Package build failed: {e}")


@router.get("/{package_id}/download")
def download_package(package_id: str):
    path = export_package_service.get_package_zip_path(package_id)
    if not path:
        raise HTTPException(status_code=404, detail="Package not found or ZIP missing")
    return FileResponse(
        str(path),
        media_type="application/zip",
        filename=path.name,
        headers={"Content-Disposition": f'attachment; filename="{path.name}"'},
    )


@router.get("/{package_id}", response_model=AssetExportPackage)
def get_package(package_id: str):
    pkg = export_package_service.get_package(package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg


@router.get("", response_model=list[AssetExportPackage])
def list_packages(asset_id: str | None = Query(default=None)):
    return export_package_service.list_packages(asset_id)
