"""
Blender headless GLB normalization script.
Run as: blender --background --python workers/blender_normalize.py -- <glb_path> <output_glb> <report_json>

Normalizes a GLB by:
  1. Centering the scene bounding box at the world origin
  2. Scaling all objects to fit inside a 2-unit bounding cube
  3. Applying transforms on mesh objects
  4. Exporting the result as a new GLB (NEVER overwrites source)
"""
from __future__ import annotations
import json
import math
import os
import sys


def main() -> None:
    argv = sys.argv
    if "--" not in argv:
        print("ERROR: No arguments after --")
        sys.exit(1)

    args = argv[argv.index("--") + 1:]
    if len(args) < 3:
        print("ERROR: Usage: blender_normalize.py -- <glb_path> <output_glb> <report_json>")
        sys.exit(1)

    glb_path, output_glb, report_json = args[0], args[1], args[2]

    if not os.path.isfile(glb_path):
        print(f"ERROR: GLB not found: {glb_path}")
        sys.exit(1)

    if os.path.abspath(glb_path) == os.path.abspath(output_glb):
        print("ERROR: Output path must differ from source — would overwrite original")
        sys.exit(1)

    import bpy
    from mathutils import Vector

    bpy.ops.wm.read_factory_settings(use_empty=True)

    print(f"Importing GLB: {glb_path}")
    bpy.ops.import_scene.gltf(filepath=glb_path)

    scene = bpy.context.scene
    mesh_objs = [o for o in scene.objects if o.type == "MESH"]

    if not mesh_objs:
        print("WARNING: No mesh objects found — re-exporting unchanged")
        os.makedirs(os.path.dirname(output_glb) or ".", exist_ok=True)
        bpy.ops.export_scene.gltf(filepath=output_glb, export_format="GLB")
        _write_report(report_json, 1.0, {}, {})
        sys.exit(0)

    # Compute scene bounding box in world space
    min_v = Vector((math.inf, math.inf, math.inf))
    max_v = Vector((-math.inf, -math.inf, -math.inf))
    for obj in mesh_objs:
        for corner in obj.bound_box:
            wc = obj.matrix_world @ Vector(corner)
            for i in range(3):
                if wc[i] < min_v[i]:
                    min_v[i] = wc[i]
                if wc[i] > max_v[i]:
                    max_v[i] = wc[i]

    original_size = max_v - min_v
    original_max_dim = max(original_size.x, original_size.y, original_size.z)
    center = (min_v + max_v) / 2.0

    target = 2.0
    scale = target / original_max_dim if original_max_dim > 0.0001 else 1.0

    print(f"Original bounds: W={original_size.x:.4f} H={original_size.z:.4f} D={original_size.y:.4f}")
    print(f"Center: ({center.x:.4f}, {center.y:.4f}, {center.z:.4f})")
    print(f"Max dim: {original_max_dim:.4f} → scale factor: {scale:.6f}")

    # Move and scale all root objects (no parent) so scene is centered and scaled
    for obj in scene.objects:
        if obj.parent is None:
            obj.location = (obj.location - center) * scale
            obj.scale = obj.scale * scale

    # Apply transforms on mesh objects only (safe; avoids breaking armature constraints)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in mesh_objs:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        try:
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        except Exception as exc:
            print(f"WARNING: transform_apply skipped for {obj.name}: {exc}")

    # Compute normalized bounding box for the report
    new_min = Vector((math.inf, math.inf, math.inf))
    new_max = Vector((-math.inf, -math.inf, -math.inf))
    for obj in mesh_objs:
        for corner in obj.bound_box:
            wc = obj.matrix_world @ Vector(corner)
            for i in range(3):
                if wc[i] < new_min[i]:
                    new_min[i] = wc[i]
                if wc[i] > new_max[i]:
                    new_max[i] = wc[i]

    normalized_size = new_max - new_min

    os.makedirs(os.path.dirname(output_glb) or ".", exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=output_glb, export_format="GLB")
    print(f"Exported normalized GLB: {output_glb}")

    _write_report(
        report_json,
        scale,
        {
            "width": round(original_size.x, 4),
            "height": round(original_size.z, 4),
            "depth": round(original_size.y, 4),
            "max_dim": round(original_max_dim, 4),
        },
        {
            "width": round(normalized_size.x, 4),
            "height": round(normalized_size.z, 4),
            "depth": round(normalized_size.y, 4),
        },
    )

    print("Normalization complete.")


def _write_report(path: str, scale: float, original: dict, normalized: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "normalization_scale": round(scale, 6),
                "original_bounds": original,
                "normalized_bounds": normalized,
            },
            f,
            indent=2,
        )
    print(f"Report: {path}")


main()
