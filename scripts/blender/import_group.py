# import_group.py
# Importiert ALLE OBJ einer sortierten Gruppe auf einmal in die aktuelle Blender-Szene.
# Zum visuellen Prüfen gedacht — NICHT alle Gruppen gleichzeitig (zu schwer).
#
# Nutzung im Blender Scripting-Tab (oder über Blender-MCP):
#   1. GROUP unten setzen ("muscles", "veins", ...)
#   2. Skript ausführen
#
# Alternativ headless nur zum Sichten:
#   blender --python scripts/blender/import_group.py -- muscles

import bpy
import sys
from pathlib import Path

# --- Konfiguration -----------------------------------------------------------
GROUP = "muscles"  # <- hier die Gruppe eintragen

# Pfad zum Projekt: Skript liegt in <repo>/scripts/blender/import_group.py
REPO = Path(__file__).resolve().parents[2]
SORTED = REPO / "NEW MODELS" / "sorted"

# CLI-Override:  ... -- <gruppe>
if "--" in sys.argv:
    arg = sys.argv[sys.argv.index("--") + 1:]
    if arg:
        GROUP = arg[0]

folder = SORTED / GROUP
objs = sorted(folder.glob("*.obj"))
print(f"[import_group] {GROUP}: {len(objs)} OBJ aus {folder}")

# Blender 4.x: bpy.ops.wm.obj_import ; ältere: bpy.ops.import_scene.obj
import_op = getattr(bpy.ops.wm, "obj_import", None)

for i, f in enumerate(objs, 1):
    if import_op:
        bpy.ops.wm.obj_import(filepath=str(f))
    else:
        bpy.ops.import_scene.obj(filepath=str(f))
    if i % 25 == 0:
        print(f"  … {i}/{len(objs)}")

print(f"[import_group] fertig: {len(objs)} Objekte in der Szene.")
