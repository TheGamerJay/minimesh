import json
from datetime import datetime, timezone

from app.models.project import ModeRequirements, ProjectSession, Readiness
from app.models.upload import ImageMeta
from app.services.upload_service import get_images
from app.services.project_context import get_session_file_path

_MATERIAL_ROLES = {"material_reference", "armor_reference"}

# â”€â”€â”€ Mode requirement definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Each entry: list of (check_key, human_label) tuples.
# Required entries must be met for the mode to be usable.
# All entries (required + recommended combined) are listed in .requirements.

_MODE_REQS: dict[str, list[tuple[str, str, bool]]] = {
    # (check_key, label, is_required)
    "two_d_anime_sheet": [
        ("front_view", "Front view", True),
        ("material_or_armor", "Material or armor reference", False),
    ],
    "three_d_model": [
        ("front_view", "Front view", True),
        ("back_view", "Back view", False),
        ("side_view", "Side view", False),
        ("material_or_armor", "Material or armor reference", False),
    ],
    "clay_sculpt": [
        ("front_view", "Front view", True),
        ("side_view", "Side view", False),
    ],
    "toy_figurine": [
        ("front_view", "Front view", True),
        ("back_view", "Back view", False),
        ("material_reference", "Material reference", False),
    ],
    "game_ready_character": [
        ("front_view", "Front view", True),
        ("back_view", "Back view", True),
        ("side_view", "Side view", True),
        ("material_or_armor", "Material or armor reference", True),
    ],
    "cinematic_high_poly": [
        ("front_view", "Front view", True),
        ("back_view", "Back view", True),
        ("side_view", "Side view", True),
        ("material_or_armor", "Material or armor reference", True),
        ("helmet_reference", "Helmet reference", False),
    ],
    "low_poly_mobile": [
        ("front_view", "Front view", True),
        ("side_view", "Side view", False),
    ],
    "prop_only": [
        ("weapon_or_armor_or_other", "Weapon, armor, or other prop reference", True),
    ],
}


def get_required_missing_for_mode(mode: str, images: list[ImageMeta]) -> list[str]:
    """Returns human-readable labels of REQUIRED requirements not met for the given mode."""
    roles = {img.reference_role for img in images}
    entries = _MODE_REQS.get(mode, _MODE_REQS["three_d_model"])
    return [
        label
        for check_key, label, is_required in entries
        if is_required and not _check_req(check_key, roles)
    ]


def _check_req(key: str, roles: set[str]) -> bool:
    if key == "front_view":
        return "front_view" in roles
    if key == "back_view":
        return "back_view" in roles
    if key == "side_view":
        return "side_view" in roles
    if key == "material_reference":
        return "material_reference" in roles
    if key == "material_or_armor":
        return bool(_MATERIAL_ROLES & roles)
    if key == "helmet_reference":
        return "helmet_reference" in roles
    if key == "weapon_or_armor_or_other":
        return bool({"weapon_reference", "armor_reference", "other"} & roles)
    return False


def _compute_mode_requirements(mode: str, roles: set[str]) -> ModeRequirements:
    entries = _MODE_REQS.get(mode, _MODE_REQS["three_d_model"])
    all_labels = [label for _, label, _ in entries]
    met: list[str] = []
    missing: list[str] = []
    for check_key, label, _ in entries:
        if _check_req(check_key, roles):
            met.append(label)
        else:
            missing.append(label)
    return ModeRequirements(
        mode=mode,
        requirements=all_labels,
        met=met,
        missing=missing,
    )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def compute_readiness(images: list[ImageMeta], current_mode: str = "three_d_model") -> Readiness:
    roles = {img.reference_role for img in images}
    has_primary = any(img.is_primary for img in images)

    score = 0
    missing: list[str] = []
    warnings: list[str] = []
    strengths: list[str] = []

    if "front_view" in roles:
        score += 25
        strengths.append("Front view provided")
    else:
        missing.append("Front view")
        warnings.append("Missing front view â€” required for generation")

    if "back_view" in roles:
        score += 20
        strengths.append("Back view provided")
    else:
        warnings.append("Missing back view")

    if "side_view" in roles:
        score += 20
        strengths.append("Side view provided")
    else:
        warnings.append("Missing side view")

    has_material = bool(roles & _MATERIAL_ROLES)
    if has_material:
        score += 20
        strengths.append("Material/armor reference provided")
    else:
        warnings.append("Missing material or armor reference")

    if has_primary:
        score += 15
        strengths.append("Primary reference selected")
    else:
        warnings.append("No primary reference selected")

    score = min(score, 100)

    has_front = "front_view" in roles
    has_back = "back_view" in roles
    has_side = "side_view" in roles

    if has_front and has_back and has_side and has_material:
        status = "strong_ready"
    elif has_front and (has_back or has_side):
        status = "basic_ready"
    else:
        status = "not_ready"

    mode_reqs = _compute_mode_requirements(current_mode, roles)

    return Readiness(
        score=score,
        status=status,
        missing=missing,
        warnings=warnings,
        strengths=strengths,
        generation_mode_requirements=mode_reqs,
    )


def get_or_create_session() -> ProjectSession:
    from app.services.generation_service import get_or_create_config  # avoid circular at module level

    images = get_images()
    config = get_or_create_config()
    readiness = compute_readiness(images, config.mode)

    session_file = get_session_file_path()
    if session_file.exists():
        try:
            data = json.loads(session_file.read_text(encoding="utf-8"))
            return ProjectSession(
                id=data.get("id", "local-session"),
                name=data.get("name", "Untitled MiniMesh Project"),
                created_at=data.get("created_at", _now()),
                updated_at=data.get("updated_at", _now()),
                images=images,
                readiness=readiness,
            )
        except Exception:
            pass

    now = _now()
    session = ProjectSession(
        id="local-session",
        name="Untitled MiniMesh Project",
        created_at=now,
        updated_at=now,
        images=images,
        readiness=readiness,
    )
    _persist(session)
    return session


def update_session_name(name: str) -> ProjectSession:
    session = get_or_create_session()
    session.name = name.strip() or "Untitled MiniMesh Project"
    session.updated_at = _now()
    _persist(session)
    return session


def _persist(session: ProjectSession) -> None:
    session_file = get_session_file_path()
    session_file.parent.mkdir(parents=True, exist_ok=True)
    session_file.write_text(
        json.dumps(
            {
                "id": session.id,
                "name": session.name,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
