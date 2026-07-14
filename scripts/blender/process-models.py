# process-models.py — headless BodyParts3D-Aufbereitung für Anatomie Fokus 3D
# =============================================================================
# Verarbeitet die sortierten Roh-OBJ (NEW MODELS/sorted/<gruppe>/) zu sauberen
# GLBs: Voxel-Remesh -> Smooth -> Decimate -> 1 Material -> Export (hifi + draco).
#
# WICHTIG (verifizierte Randbedingungen):
#  - Roh-OBJ sind in MILLIMETERN -> Scale 0.001 (= Meter, wie die App erwartet).
#  - Transform Roh->App ist (x, z, -y)*0.001 = identischer Import + Blender
#    Standard-Z-up -> glTF-Y-up-Export. NICHT manuell zentrieren/rotieren.
#  - Dateiname Ausgabe = nackte FJ-ID (<FJ>.glb), Ordner = Gruppe.
#  - Voxel-Remesh verwirft die ungenutzten Original-UVs automatisch.
#
# AUSGABE (Staging, überschreibt NICHT die Live-App):
#   NEW MODELS/processed/hifi/<gruppe>/<FJ>.glb     (Master, ohne Draco)
#   NEW MODELS/processed/draco/<gruppe>/<FJ>.glb    (Web-Default, Draco)
#
# AUFRUF:
#   # Pilot (5 repräsentative Teile, beide Tiers, mit Transform-Check):
#   blender --background --python scripts/blender/process-models.py -- --pilot
#
#   # Eine ganze Gruppe:
#   blender --background --python scripts/blender/process-models.py -- --group veins
#
#   # Alles:
#   blender --background --python scripts/blender/process-models.py -- --all
#
#   # Nur N pro Gruppe (Testlauf):
#   blender --background --python scripts/blender/process-models.py -- --all --limit 3
# =============================================================================

import bpy
import sys
import os
import json
import math
from pathlib import Path

# ---- Pfade ------------------------------------------------------------------
REPO = Path(__file__).resolve().parents[2]
SORTED = REPO / "NEW MODELS" / "sorted"
OUT = REPO / "NEW MODELS" / "processed"
META = REPO / "public" / "data" / "meta.json"

SCALE = 0.0010844  # an die bestehende App angeglichen (Roh-mm * 0.001 * 1.08443).
                   # Die Legacy-App skaliert ~1.0844x größer als echte Meter; damit die
                   # neuen Teile NAHTLOS zu den vorhandenen passen, denselben Maßstab nutzen.

# ---- Parameter pro Gruppe (am Pilot kalibrieren!) ---------------------------
# remesh  = Voxel-Remesh anwenden? (False für röhrenförmige Strukturen)
# density = Ziel-Voxel über die BBox-Diagonale (höher = feiner). Voxelgröße
#           wird PRO OBJEKT relativ berechnet (diag/density), nicht absolut —
#           verhindert Explosion bei großen und Verschwinden bei kleinen Teilen.
# hifi/draco = Ziel-Dreiecke pro Tier
GROUP_PARAMS = {
    # röhrenförmig -> KEIN Remesh (sonst zerfallen die Schläuche)
    "arteries":  {"remesh": False, "density": 0,   "hifi": 12000, "draco": 4000},
    "veins":     {"remesh": False, "density": 0,   "hifi": 12000, "draco": 4000},
    "nerves":    {"remesh": False, "density": 0,   "hifi": 12000, "draco": 4000},
    # massig -> Remesh
    "bones":     {"remesh": True,  "density": 200, "hifi": 30000, "draco": 9000},
    "teeth":     {"remesh": True,  "density": 220, "hifi": 15000, "draco": 5000},
    "cartilage": {"remesh": True,  "density": 180, "hifi": 18000, "draco": 6000},
    "muscles":   {"remesh": True,  "density": 160, "hifi": 22000, "draco": 7000},
    "organs":    {"remesh": True,  "density": 150, "hifi": 22000, "draco": 7000},
    "glands":    {"remesh": True,  "density": 170, "hifi": 18000, "draco": 6000},
    "heart":     {"remesh": True,  "density": 170, "hifi": 25000, "draco": 8000},
    "lungs":     {"remesh": True,  "density": 150, "hifi": 22000, "draco": 7000},
    "brain":     {"remesh": True,  "density": 170, "hifi": 25000, "draco": 8000},
    "ligaments": {"remesh": True,  "density": 170, "hifi": 18000, "draco": 6000},
    "eyes":      {"remesh": True,  "density": 200, "hifi": 15000, "draco": 5000},
    "ear":       {"remesh": True,  "density": 220, "hifi": 12000, "draco": 4000},
    "skin_hair": {"remesh": True,  "density": 130, "hifi": 30000, "draco": 9000},
}
DEFAULT_PARAMS = {"remesh": True, "density": 160, "hifi": 20000, "draco": 6000}
VOXEL_MIN = 0.0002   # 0.2 mm
VOXEL_MAX = 0.0030   # 3.0 mm

SMOOTH_ITERS = 20            # stärker glätten (MRT-Rauschen raus)
SMOOTH_FACTOR = 0.5
AUTO_SMOOTH_ANGLE = math.radians(60)   # weichere Schattierung (weniger Facetten-"Körner")

# ---- Default-Farben aus meta.json (Gruppe -> hex) ---------------------------
def load_group_colors():
    colors = {}
    try:
        meta = json.loads(META.read_text(encoding="utf-8"))
        for e in meta:
            g = (e.get("classification") or {}).get("group")
            c = (e.get("model") or {}).get("default_color")
            if g and c and g not in colors:
                colors[g] = c
    except Exception as ex:
        print("  ! meta.json-Farben nicht ladbar:", ex)
    return colors

GROUP_COLORS = load_group_colors()

def hex_to_rgba(h):
    h = (h or "#cccccc").lstrip("#")
    if len(h) != 6:
        h = "cccccc"
    r, g, b = (int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    # sRGB -> linear (Blender erwartet linear)
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), 1.0)

_material_cache = {}
def group_material(group):
    if group in _material_cache:
        return _material_cache[group]
    mat = bpy.data.materials.new(name=f"mat_{group}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = hex_to_rgba(GROUP_COLORS.get(group))
        bsdf.inputs["Metallic"].default_value = 0.0
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.6
    _material_cache[group] = mat
    return mat

# ---- Szene-Helpers ----------------------------------------------------------
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.objects):
        for d in list(block):
            try:
                block.remove(d)
            except Exception:
                pass

def import_obj(path):
    # identischer Import (OBJ Z-up == Blender Z-up); Export macht Z->Y-up
    bpy.ops.wm.obj_import(filepath=str(path), up_axis="Z", forward_axis="Y")
    objs = [o for o in bpy.context.selected_objects if o.type == "MESH"]
    if not objs:
        objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    return objs

def join_objects(objs):
    if len(objs) <= 1:
        return objs[0] if objs else None
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    return bpy.context.view_layer.objects.active

def tri_count(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)

def apply_modifier(obj, mod):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)

# ---- Verarbeitung eines Teils ----------------------------------------------
def process_one(obj_path, group, params, tiers, fj, translate_mm=None):
    clear_scene()
    objs = import_obj(obj_path)
    if not objs:
        print(f"  ! kein Mesh in {obj_path.name}")
        return None
    obj = join_objects(objs)

    # Optionaler Roh-Versatz in mm VOR der Skalierung (z. B. 3.0-Set an Hauptset angleichen)
    if translate_mm:
        obj.location = (obj.location.x + translate_mm[0],
                        obj.location.y + translate_mm[1],
                        obj.location.z + translate_mm[2])
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # Scale mm -> m
    obj.scale = (SCALE, SCALE, SCALE)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    tris_raw = tri_count(obj)

    # 1) Voxel-Remesh (nur massige Gruppen; Voxelgröße relativ zur Objektgröße)
    voxel = 0.0
    if params.get("remesh") and params.get("density", 0) > 0:
        dim = obj.dimensions
        diag = math.sqrt(dim.x**2 + dim.y**2 + dim.z**2)
        voxel = min(VOXEL_MAX, max(VOXEL_MIN, diag / params["density"]))
        obj.data.remesh_voxel_size = voxel
        obj.data.remesh_voxel_adaptivity = 0.0   # gleichmäßiges Gitter (glatter; Decimate dünnt aus)
        bpy.ops.object.voxel_remesh()
    tris_remesh = tri_count(obj)

    # 2) Smooth (Treppchen glätten)
    sm = obj.modifiers.new(name="Smooth", type="SMOOTH")
    sm.factor = SMOOTH_FACTOR
    sm.iterations = SMOOTH_ITERS
    apply_modifier(obj, sm)

    # 3) Material + Shading
    obj.data.materials.clear()
    obj.data.materials.append(group_material(group))
    bpy.ops.object.shade_smooth()
    if hasattr(obj.data, "use_auto_smooth"):
        obj.data.use_auto_smooth = True
        obj.data.auto_smooth_angle = AUTO_SMOOTH_ANGLE

    stats = {"fj": fj, "group": group, "tris_raw": tris_raw,
             "tris_remesh": tris_remesh, "tiers": {}}

    # 4) Decimate + Export pro Tier
    for tier in tiers:
        target = params[tier]
        # Decimate als temporären Modifier (nicht zerstörend für den nächsten Tier)
        cur = tri_count(obj)
        ratio = min(1.0, max(0.02, target / cur)) if cur > target else 1.0
        dec = None
        if ratio < 1.0:
            dec = obj.modifiers.new(name="Decimate", type="DECIMATE")
            dec.decimate_type = "COLLAPSE"
            dec.ratio = ratio

        dest_dir = OUT / tier / group
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / f"{fj}.glb"

        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.export_scene.gltf(
            filepath=str(dest),
            export_format="GLB",
            use_selection=True,
            export_yup=True,
            export_apply=True,                # wendet Decimate-Modifier beim Export an
            export_normals=True,
            export_texcoords=False,           # ungenutzte UVs raus
            export_materials="EXPORT",
            export_cameras=False,
            export_lights=False,
            # Draco-Kompression macht der Node-Nachschritt (Blender-Lib fehlt hier):
            #   npx gltf-transform draco <in> <out>
            export_draco_mesh_compression_enable=False,
        )
        size = dest.stat().st_size if dest.exists() else 0
        stats["tiers"][tier] = {"target": target, "ratio": round(ratio, 3),
                                "bytes": size, "path": str(dest.relative_to(REPO))}
        if dec:
            obj.modifiers.remove(dec)

    return stats

# ---- Argumente --------------------------------------------------------------
def get_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    a = {"group": None, "all": False, "pilot": False, "limit": None,
         "tiers": ["hifi", "draco"], "only_fj_file": None, "translate_mm": None}
    i = 0
    while i < len(argv):
        t = argv[i]
        if t == "--group": a["group"] = argv[i+1]; i += 2
        elif t == "--all": a["all"] = True; i += 1
        elif t == "--pilot": a["pilot"] = True; i += 1
        elif t == "--limit": a["limit"] = int(argv[i+1]); i += 2
        elif t == "--tier": a["tiers"] = argv[i+1].split(","); i += 2
        elif t == "--only-fj-file": a["only_fj_file"] = argv[i+1]; i += 2  # nur diese FJ (1/Zeile)
        elif t == "--translate-mm":  # Roh-Versatz in mm "dx,dy,dz" VOR Skalierung (z.B. 3.0-Set-Korrektur)
            a["translate_mm"] = [float(x) for x in argv[i+1].split(",")]; i += 2
        else: i += 1
    return a

PILOT_FILES = [  # je 1 repräsentatives Teil pro Typ
    ("bones",     "FJ1228"),  # Sesambein (klein, kompakt)
    ("veins",     "FJ1858"),  # Gefäßsegment (dünn)
    ("organs",    "FJ1895"),  # Pankreas-Parenchym (blobbig)
    ("cartilage", "FJ2440"),  # Cricoid-Knorpel (flächig)
    ("muscles",   "FJ114"),   # Levator anguli oris (Muskel)
]

def collect_jobs(args):
    jobs = []  # (group, obj_path, fj)
    def add_group(group, limit=None):
        d = SORTED / group
        if not d.is_dir():
            return
        files = sorted(d.glob("*.obj"))
        if limit:
            files = files[:limit]
        for f in files:
            fj = f.name.split("_", 1)[0].upper()
            jobs.append((group, f, fj))

    if args["pilot"]:
        for group, fj in PILOT_FILES:
            d = SORTED / group
            match = next((f for f in d.glob(f"{fj}_*.obj")), None) if d.is_dir() else None
            if match:
                jobs.append((group, match, fj))
            else:
                print(f"  ! Pilot-Datei {fj} in {group} nicht gefunden")
    elif args["group"]:
        add_group(args["group"], args["limit"])
    elif args["all"]:
        for group in sorted(p.name for p in SORTED.iterdir() if p.is_dir() and not p.name.startswith("_")):
            add_group(group, args["limit"])

    # Filter: nur bestimmte FJ (z. B. nur die neuen Teile neu rechnen)
    if args["only_fj_file"]:
        wanted = set(l.strip().upper() for l in Path(args["only_fj_file"]).read_text().splitlines() if l.strip())
        # wenn weder --group noch --all gesetzt: aus allen Gruppen die gewünschten ziehen
        if not jobs:
            for group in sorted(p.name for p in SORTED.iterdir() if p.is_dir() and not p.name.startswith("_")):
                add_group(group)
        jobs = [j for j in jobs if j[2].upper() in wanted]
    return jobs

# ---- Main -------------------------------------------------------------------
def main():
    args = get_args()
    jobs = collect_jobs(args)
    if not jobs:
        print("Keine Jobs. Nutze --pilot | --group <g> | --all")
        return
    print(f"== process-models == {len(jobs)} Teil(e), Tiers={args['tiers']}")
    all_stats = []
    for n, (group, path, fj) in enumerate(jobs, 1):
        params = GROUP_PARAMS.get(group, DEFAULT_PARAMS)
        try:
            s = process_one(path, group, params, args["tiers"], fj, args["translate_mm"])
        except Exception as ex:
            print(f"  [{n}/{len(jobs)}] FEHLER {fj} ({group}): {ex}")
            continue
        if s:
            all_stats.append(s)
            t = " | ".join(f"{k}:{v['bytes']//1024}KB" for k, v in s["tiers"].items())
            print(f"  [{n}/{len(jobs)}] {fj:9} {group:10} raw {s['tris_raw']:>7} -> remesh {s['tris_remesh']:>7} | {t}")

    rep = OUT / "_process-report.json"
    OUT.mkdir(parents=True, exist_ok=True)
    rep.write_text(json.dumps(all_stats, indent=2), encoding="utf-8")
    print(f"\nFertig: {len(all_stats)} verarbeitet -> {OUT.relative_to(REPO)}/  (Report: {rep.name})")

main()
