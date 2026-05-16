# MiniMesh — Project Vision

## What is MiniMesh?

MiniMesh is an AI-powered image-to-3D pipeline studio. Users upload reference images of characters, creatures, props, or environments, and the platform generates production-ready 3D assets through a guided multi-stage pipeline.

## Core Workflow

1. **Upload references** — front, side, back, and detail views of the subject.
2. **Choose sculpt type** — realistic, stylized, clay, toy, anime, game-ready, or custom.
3. **Generate mesh** — AI providers process references and produce a base 3D mesh.
4. **Texture & materials** — auto-texture with PBR materials, normal maps, and roughness.
5. **Rig Studio** — automatic rigging with bone placement, weight painting, and controls.
6. **Animation preview** — retarget motion clips, preview in-browser.
7. **Export** — download FBX, GLTF, OBJ, or Blender-ready `.blend` packages.

## Asset Types

MiniMesh supports generating:

- **Characters** — humanoid, creature, fantasy, sci-fi
- **Props** — weapons, furniture, vehicles, tools
- **Environments** — terrain patches, modular architecture pieces
- **Stylized variants** — chibi, clay render, toy figurine, ink/anime, low-poly game-ready

## Pipeline Philosophy

- Non-destructive: every stage is a discrete step with its own output artifact.
- Provider-agnostic: AI generation backends are swappable (Tripo3D, Meshy, Hyper3D, etc.).
- Export-first: every asset exits as a universally compatible format.
- Studio-grade: outputs should be usable in Blender, Unreal, Unity, and Cinema 4D with minimal cleanup.

## Long-Term Vision

MiniMesh evolves into a full creative AI studio where artists can iterate on characters from sketch to production-ready rigged animation in a single session — without leaving the browser.
