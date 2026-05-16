"""
Blender headless GLB inspection script.
Run as: blender --background --python workers/blender_inspect.py -- <glb_path> <output_json>
"""
from __future__ import annotations
import json
import sys
import os


def main() -> None:
    argv = sys.argv
    if "--" not in argv:
        print("ERROR: No arguments after --")
        sys.exit(1)

    args = argv[argv.index("--") + 1:]
    if len(args) < 2:
        print("ERROR: Usage: blender_inspect.py -- <glb_path> <output_json>")
        sys.exit(1)

    glb_path = args[0]
    output_json = args[1]

    if not os.path.isfile(glb_path):
        print(f"ERROR: GLB file not found: {glb_path}")
        sys.exit(1)

    import bpy
    from mathutils import Vector

    # Clear scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    print(f"Importing GLB: {glb_path}")
    bpy.ops.import_scene.gltf(filepath=glb_path)

    scene = bpy.context.scene
    objects = list(scene.objects)

    object_count = len(objects)
    mesh_objects = [o for o in objects if o.type == "MESH"]
    armature_objects = [o for o in objects if o.type == "ARMATURE"]

    mesh_count = len(mesh_objects)
    has_armature = len(armature_objects) > 0

    object_names = [o.name for o in objects]

    # Collect materials
    material_set: dict[str, bool] = {}
    has_uvs = False
    estimated_triangles = 0

    for obj in mesh_objects:
        mesh = obj.data
        if mesh is None:
            continue

        # Count triangles (each polygon has len(polygon.vertices) - 2 triangles)
        for poly in mesh.polygons:
            n = len(poly.vertices)
            estimated_triangles += max(1, n - 2)

        # UVs
        if mesh.uv_layers:
            has_uvs = True

        # Materials
        for mat in obj.material_slots:
            if mat.material and mat.material.name not in material_set:
                material_set[mat.material.name] = True

    material_count = len(material_set)
    material_names = list(material_set.keys())

    # Animations
    has_animations = len(bpy.data.actions) > 0

    # Bounding box (world space)
    min_v = Vector((float("inf"), float("inf"), float("inf")))
    max_v = Vector((float("-inf"), float("-inf"), float("-inf")))
    bbox_computed = False

    for obj in mesh_objects:
        for corner in obj.bound_box:
            world_corner = obj.matrix_world @ Vector(corner)
            min_v.x = min(min_v.x, world_corner.x)
            min_v.y = min(min_v.y, world_corner.y)
            min_v.z = min(min_v.z, world_corner.z)
            max_v.x = max(max_v.x, world_corner.x)
            max_v.y = max(max_v.y, world_corner.y)
            max_v.z = max(max_v.z, world_corner.z)
            bbox_computed = True

    if bbox_computed:
        bbox_width = round(max_v.x - min_v.x, 4)
        bbox_height = round(max_v.z - min_v.z, 4)
        bbox_depth = round(max_v.y - min_v.y, 4)
    else:
        bbox_width = bbox_height = bbox_depth = 0.0

    file_size = os.path.getsize(glb_path)

    blender_version = bpy.app.version_string

    result = {
        "object_count": object_count,
        "mesh_count": mesh_count,
        "material_count": material_count,
        "estimated_triangles": estimated_triangles,
        "bounding_box": {
            "width": bbox_width,
            "height": bbox_height,
            "depth": bbox_depth,
        },
        "object_names": object_names,
        "material_names": material_names,
        "has_armature": has_armature,
        "has_animations": has_animations,
        "has_uvs": has_uvs,
        "file_size": file_size,
        "fallback_estimate": False,
        "blender_used": True,
        "blender_version": blender_version,
    }

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(f"Inspection complete. Objects: {object_count}, Meshes: {mesh_count}, Triangles: {estimated_triangles}")
    print(f"Materials: {material_count}, Has UVs: {has_uvs}, Has Armature: {has_armature}, Has Animations: {has_animations}")
    print(f"Output: {output_json}")


main()
