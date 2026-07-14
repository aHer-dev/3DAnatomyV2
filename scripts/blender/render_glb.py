# render_glb.py — rendert eine GLB headless zu PNG (zur Sichtprüfung)
# Aufruf: blender --background --python scripts/blender/render_glb.py -- <in.glb> <out.png>
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
inp, outp = argv[0], argv[1]

# Szene leeren
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

bpy.ops.import_scene.gltf(filepath=inp)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]

# gemeinsame BBox
mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
for o in meshes:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
center = (mn + mx) / 2
size = (mx - mn).length

# Kamera
cam_data = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_data)
cam_data.lens = 35
cam_data.clip_start = 1e-5      # winzige Teile (mm) nicht wegclippen
cam_data.clip_end = 100
bpy.context.collection.objects.link(cam)
dist = max(size, 1e-4) * 1.05
cam.location = center + Vector((dist, -dist, dist * 0.5))
d = (center - cam.location).normalized()
cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam

# Licht
for ang in [(1, -1, 1), (-1, -0.5, 0.5)]:
    ld = bpy.data.lights.new("l", type="SUN"); ld.energy = 3
    lo = bpy.data.objects.new("l", ld); bpy.context.collection.objects.link(lo)
    lo.rotation_euler = Vector(ang).to_track_quat('-Z', 'Y').to_euler()

# heller Standard-Look, damit Oberfläche/Rauschen sichtbar wird
for o in meshes:
    if o.data.materials:
        m = o.data.materials[0]
        if m.use_nodes:
            b = m.node_tree.nodes.get("Principled BSDF")
            if b: b.inputs["Base Color"].default_value = (0.8, 0.4, 0.4, 1)

sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x = 900; sc.render.resolution_y = 900
sc.render.filepath = outp
sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[1].default_value = 1.2
bpy.ops.render.render(write_still=True)
print("rendered", outp)
