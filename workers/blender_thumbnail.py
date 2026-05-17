"""
Blender headless thumbnail rendering script.
Run as: blender --background --python workers/blender_thumbnail.py -- <glb_path> <output_png> [render_type]

Supported render_type: preview (default), turntable, material_preview
All types render a single angled snapshot (frame sequences are a future phase).
"""
from __future__ import annotations
import math
import os
import sys


def main() -> None:
    argv = sys.argv
    if "--" not in argv:
        print("ERROR: No arguments after --")
        sys.exit(1)

    args = argv[argv.index("--") + 1:]
    if len(args) < 2:
        print("ERROR: Usage: blender_thumbnail.py -- <glb_path> <output_png> [render_type]")
        sys.exit(1)

    glb_path = args[0]
    output_png = args[1]
    render_type = args[2] if len(args) > 2 else "preview"

    if not os.path.isfile(glb_path):
        print(f"ERROR: GLB not found: {glb_path}")
        sys.exit(1)

    import bpy
    from mathutils import Vector

    bpy.ops.wm.read_factory_settings(use_empty=True)

    print(f"Importing GLB: {glb_path}")
    bpy.ops.import_scene.gltf(filepath=glb_path)

    scene = bpy.context.scene
    mesh_objs = [o for o in scene.objects if o.type == "MESH"]

    # Compute scene bounding box for camera placement
    if mesh_objs:
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
        center = (min_v + max_v) / 2.0
        size = max_v - min_v
        max_dim = max(size.x, size.y, size.z)
    else:
        center = Vector((0.0, 0.0, 0.0))
        max_dim = 2.0

    print(f"Scene center: ({center.x:.3f}, {center.y:.3f}, {center.z:.3f}), max_dim: {max_dim:.3f}")

    dist = max_dim * 2.0 + 0.5

    # Angle: 40° horizontal (front-right), 28° vertical
    angle_h = math.radians(40 if render_type != "material_preview" else 20)
    angle_v = math.radians(28 if render_type != "material_preview" else 15)

    cam_x = center.x + dist * math.cos(angle_v) * math.sin(angle_h)
    cam_y = center.y - dist * math.cos(angle_v) * math.cos(angle_h)
    cam_z = center.z + dist * math.sin(angle_v)

    cam_data = bpy.data.cameras.new("_thumbnail_cam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("_thumbnail_cam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = Vector((cam_x, cam_y, cam_z))
    direction = center - cam_obj.location
    cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam_obj
    print(f"Camera at ({cam_x:.3f}, {cam_y:.3f}, {cam_z:.3f})")

    # Lighting rig — three-point (key / fill / rim)
    for name, energy, loc, rot in [
        ("_key_light",  4.0, (3.0, -3.0, 5.0), (55, 0,   45)),
        ("_fill_light", 1.5, (-3.0, 2.0, 3.0), (40, 0, -110)),
        ("_rim_light",  0.8, (0.0,  3.0, 2.0), (30, 0,  170)),
    ]:
        ld = bpy.data.lights.new(name, type="SUN")
        ld.energy = energy
        lo = bpy.data.objects.new(name, ld)
        scene.collection.objects.link(lo)
        lo.location = Vector(loc)
        lo.rotation_euler = (
            math.radians(rot[0]),
            math.radians(rot[1]),
            math.radians(rot[2]),
        )

    # Render settings — Workbench is reliable in headless mode
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.background_type = "THEME"
    if render_type == "material_preview":
        scene.display.shading.show_specular_highlight = True

    os.makedirs(os.path.dirname(output_png) or ".", exist_ok=True)
    scene.render.filepath = output_png

    print(f"Rendering [{render_type}] → {output_png}")
    bpy.ops.render.render(write_still=True)
    print("Render complete.")


main()
