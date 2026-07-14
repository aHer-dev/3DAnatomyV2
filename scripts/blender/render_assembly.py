# render_assembly.py — mehrere GLB in EINE Szene laden und rendern (Passt-das-zusammen-Test)
# Aufruf: blender --background --python scripts/blender/render_assembly.py -- <out.png> <glb1> <glb2> ...
import bpy, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
outp, files = argv[0], argv[1:]

bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete()
colors = [(0.85,0.85,0.82,1),(0.85,0.25,0.25,1),(0.25,0.5,0.9,1),(0.3,0.8,0.3,1),(0.9,0.7,0.2,1)]
for i, f in enumerate(files):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=f)
    new = [o for o in bpy.context.scene.objects if o not in before and o.type=="MESH"]
    col = colors[i % len(colors)]
    for o in new:
        m = bpy.data.materials.new("c"); m.use_nodes=True
        b=m.node_tree.nodes.get("Principled BSDF")
        if b: b.inputs["Base Color"].default_value=col
        o.data.materials.clear(); o.data.materials.append(m)

meshes=[o for o in bpy.context.scene.objects if o.type=="MESH"]
mn=Vector((1e9,1e9,1e9)); mx=Vector((-1e9,-1e9,-1e9))
for o in meshes:
    for c in o.bound_box:
        w=o.matrix_world@Vector(c); mn=Vector(map(min,mn,w)); mx=Vector(map(max,mx,w))
center=(mn+mx)/2; size=max((mx-mn).length,1e-4)

cam_d=bpy.data.cameras.new("c"); cam=bpy.data.objects.new("c",cam_d)
cam_d.clip_start=1e-5; cam_d.clip_end=100; cam_d.lens=40
bpy.context.collection.objects.link(cam)
cam.location=center+Vector((0,-size*1.2,size*0.05))  # frontal (anterior)
cam.rotation_euler=(center-cam.location).normalized().to_track_quat('-Z','Y').to_euler()
bpy.context.scene.camera=cam
for ang in [(0.3,-1,0.4),(-0.3,-1,0.2)]:
    ld=bpy.data.lights.new("l",type="SUN"); ld.energy=3
    lo=bpy.data.objects.new("l",ld); bpy.context.collection.objects.link(lo)
    lo.rotation_euler=Vector(ang).to_track_quat('-Z','Y').to_euler()
sc=bpy.context.scene; sc.render.engine="BLENDER_EEVEE"
sc.render.resolution_x=800; sc.render.resolution_y=900; sc.render.filepath=outp
sc.world.use_nodes=True; sc.world.node_tree.nodes["Background"].inputs[1].default_value=0.6
bpy.ops.render.render(write_still=True)
print("rendered",outp,"parts:",len(meshes))
