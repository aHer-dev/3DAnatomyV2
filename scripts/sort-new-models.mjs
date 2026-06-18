// sort-new-models.mjs
// Sortiert die rohen BodyParts3D-OBJ-Downloads (NEW MODELS/) in Gruppen-Ordner
// (NEW MODELS/sorted/<gruppe>/) als Vorstufe für die Blender-Aufbereitung.
//
// - Originale werden NUR kopiert, nie verändert/verschoben.
// - Dateinamen bleiben vollständig (FJ_BP_FMA_Label.obj) → im Blender erkennbar.
// - Gruppe wird in dieser Priorität bestimmt:
//     1) vorhandenes App-Modell  public/models/<g>/<FJ>.glb     (sicher)
//     2) meta.json über FMA-ID                                   (sicher)
//     3) meta.json über FJ-ID                                    (sicher)
//     4) Label-Heuristik                                          (→ REVIEW)
//     5) keine Übereinstimmung → _unsorted                        (→ REVIEW)
// - Schreibt _manifest.json (alle Zuordnungen) und REVIEW.md (nur unsichere).
//
// Lauf:  node scripts/sort-new-models.mjs

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'NEW MODELS');
const OUT = path.join(SRC, 'sorted');
const MODELS = path.join(ROOT, 'public/models');
const META = path.join(ROOT, 'public/data/meta.json');

// ---- 1) sichere Maps aus App-Bestand + meta.json -------------------------
const fjFS = {};
for (const g of fs.readdirSync(MODELS)) {
  const gp = path.join(MODELS, g);
  if (!fs.statSync(gp).isDirectory() || ['hifi', 'lofi'].includes(g)) continue;
  for (const f of fs.readdirSync(gp)) {
    const m = f.match(/^(FJ\d+[A-Z]?)\.glb$/i);
    if (m) fjFS[m[1].toUpperCase()] = g;
  }
}
const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const fmaG = {}, fjMeta = {};
for (const e of meta) {
  const g = e.classification?.group;
  if (!g) continue;
  const fma = e.info?.links?.fma;
  if (fma) fmaG[fma.toLowerCase()] = g;
  const r = e.model?.root_name;
  if (r) fjMeta[r.toUpperCase()] = g;
}

// ---- 2) Label-Heuristik (nur Fallback, Reihenfolge = Priorität) ----------
const HEUR = [
  ['nerves', /\bnerve|ganglion|plexus|ansa cervicalis|cauda equina|spinal cord|neural tissue|olfactory tract|nervous|ramus communicans\b/i],
  ['lungs', /bronch|bronchopulmonary|parenchyma|alveol|pulmonary segment|lobe of (?:left|right) lung/i],
  ['brain', /\bdura|tentorium|falx|arachnoid|pia mater|cerebral|cerebellum|cerebellar|ventricle|olfactory|hemisphere|medulla|pons|midbrain|thalamus|hypothalamus|corpus callosum|fornix|meninge|gyrus|gyri|sulcus|cuneus|precuneus|cortex|nucleus|nuclei|substantia nigra|striatum|putamen|pallidum|caudate|amygdala|hippocampus|insula|operculum|preoptic|suprachiasmatic|supraoptic|periventricular|subthalamic|mammillary|cingulate|uncus|claustrum|tegmentum|colliculus|geniculate\b/i],
  ['veins', /\bvein|venous|venosus|dural sinus|sigmoid sinus|cavernous sinus|sagittal sinus|straight sinus|transverse sinus|petrosal sinus|jugular bulb|occipital sinus|marginal sinus|sinus confluence|confluence of (?:the )?sinus\b/i],
  ['arteries', /\bartery|arterial|aorta|aortic|arteriole|carotid sinus\b/i],
  ['muscles', /\bmuscle|risorius|zygomaticus|temporalis|temporoparietalis|buccinator|masseter|pterygoid|orbicularis|levator|depressor|procerus|mentalis|frontalis|occipitalis|corrugator|nasalis|platysma|lumbrical|interosse|oblique|transversus|rectus|sphincter|dilator|auricular|stapedius|tensor|constrictor|palato|genio|hyoid|stylo|digastric|mylohyoid|omohyoid|sterno|scalene|longus|capitis|spinae|multifidus|rotatore?s|intercostal|abdominis|latissimus|trapezius|deltoid|pectoralis|gluteus|biceps|triceps|brachii|sartorius|gracilis|soleus|gastrocnemius|thyro-?arytenoid|cricothyroid|vocalis|aryepiglottic/i],
  ['bones', /\bbone|vertebra|\brib\b|phalanx|metacarpal|metatarsal|carpal|tarsal|sternum|scapula|clavicle|sacrum|coccyx|skull|cranium|mandible|maxilla|ethmoid|sphenoid|occipital bone|parietal bone|temporal bone|frontal bone|nasal bone|zygomatic bone|palatine bone|vomer|hyoid bone|perpendicular plate|process of|tuberosity|condyle/i],
  ['ligaments', /ligament|tendon|fascia|aponeurosis|retinaculum|membrane of/i],
  ['cartilage', /cartilage|meniscus|intervertebral disc|costal cartilage/i],
  ['eyes', /palpebral|lacrimal|conjunctiva|eyelid|eyeball|cornea|sclera|retina|iris|lens of|orbit/i],
  ['organs', /gland|liver|kidney|spleen|pancreas|stomach|intestine|colon|caecum|rectum|bladder|uterus|prostate|ovary|testis|gallbladder|esophagus|oesophagus|trachea|larynx|pharynx|peritoneum|omentum|mesentery|thymus|tonsil/i],
  ['skin_hair', /\bskin\b|epidermis|dermis|hair|nail|integument|subcutaneous/i],
];
function heuristic(label) {
  for (const [g, re] of HEUR) if (re.test(label)) return g;
  return null;
}

// ---- 3) OBJ einsammeln + parsen ------------------------------------------
function listObjs(d) {
  let o = [];
  for (const f of fs.readdirSync(d)) {
    if (path.resolve(d, f) === path.resolve(OUT)) continue; // sorted/ nicht reinziehen
    const p = path.join(d, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) o = o.concat(listObjs(p));
    else if (f.toLowerCase().endsWith('.obj')) o.push(p);
  }
  return o;
}
const parse = (file) => {
  const b = path.basename(file).replace(/\.obj$/i, '');
  const m = b.match(/^(FJ\d+[A-Z]?)_(BP\d+)_(FMA\d+)_(.+)$/i);
  return m ? { fj: m[1].toUpperCase(), bp: m[2], fma: m[3].toLowerCase(), label: m[4], file } : null;
};

// frische sorted/-Ausgabe (idempotent)
fs.rmSync(OUT, { recursive: true, force: true });

const objs = listObjs(SRC);
const manifest = [];
const review = [];
const counts = {};
let unparsed = [];

for (const o of objs) {
  const p = parse(o);
  if (!p) { unparsed.push(path.basename(o)); continue; }

  // Priorität: meta.json (Label-geprüfte Klassifikation) VOR Ordnerlage,
  // weil die bestehenden public/models/<g>/-Ordner teils fehlsortiert sind.
  let group, source;
  if (fmaG[p.fma]) { group = fmaG[p.fma]; source = 'meta_fma'; }
  else if (fjMeta[p.fj]) { group = fjMeta[p.fj]; source = 'meta_fj'; }
  else if (fjFS[p.fj]) { group = fjFS[p.fj]; source = 'fs'; }
  else {
    const h = heuristic(p.label);
    if (h) { group = h; source = 'heuristic'; }
    else { group = '_unsorted'; source = 'unsorted'; }
  }

  // Konflikt: aktuelle App-Ordnerlage weicht von gewählter Gruppe ab
  const fsGroup = fjFS[p.fj];
  const conflict = fsGroup && fsGroup !== group ? fsGroup : null;

  const destDir = path.join(OUT, group);
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, path.basename(o));
  fs.copyFileSync(o, dest);

  counts[group] = (counts[group] || 0) + 1;
  const rec = { fj: p.fj, fma: p.fma, label: p.label, group, source, conflict, file: path.basename(o) };
  manifest.push(rec);
  if (source === 'heuristic' || source === 'unsorted') review.push(rec);
}

// ---- 4) Reports schreiben -------------------------------------------------
fs.writeFileSync(path.join(OUT, '_manifest.json'), JSON.stringify(manifest, null, 2));

const byGroupReview = {};
for (const r of review) (byGroupReview[r.group] ||= []).push(r);
let md = `# REVIEW — heuristisch/unsicher zugeordnet\n\n`;
md += `Diese ${review.length} Teile wurden **nicht** über App-Bestand oder meta.json zugeordnet,\n`;
md += `sondern per Label-Heuristik (oder gar nicht → \`_unsorted\`). Beim Bearbeiten in Blender prüfen\n`;
md += `und ggf. in die richtige Gruppe verschieben.\n\n`;
for (const g of Object.keys(byGroupReview).sort()) {
  md += `## ${g} (${byGroupReview[g].length})\n\n`;
  for (const r of byGroupReview[g].sort((a, b) => a.label.localeCompare(b.label)))
    md += `- ${r.fj} · ${r.fma} · ${r.label}${r.source === 'unsorted' ? ' · **KEIN KEYWORD**' : ''}\n`;
  md += `\n`;
}
fs.writeFileSync(path.join(OUT, 'REVIEW.md'), md);

// ---- 5) Konsolen-Summary --------------------------------------------------
console.log(`OBJ gesamt: ${objs.length} | einsortiert: ${manifest.length} | unparsed: ${unparsed.length}`);
console.log(`sicher (fs/meta): ${manifest.filter(m => m.source !== 'heuristic' && m.source !== 'unsorted').length}`);
console.log(`heuristisch:      ${manifest.filter(m => m.source === 'heuristic').length}`);
console.log(`_unsorted:        ${manifest.filter(m => m.source === 'unsorted').length}`);
const conflicts = manifest.filter(m => m.conflict);
console.log(`Konflikte (App-Ordner ≠ meta.json): ${conflicts.length}  → siehe _conflicts.json`);
fs.writeFileSync(path.join(OUT, '_conflicts.json'), JSON.stringify(conflicts, null, 2));
console.log('\nPro Gruppe (sorted/):');
for (const [g, c] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${g.padEnd(12)} ${c}`);
if (unparsed.length) console.log('\nUnparsed:', unparsed.slice(0, 10).join(' | '));
console.log(`\n→ ${path.relative(ROOT, OUT)}/  (+ _manifest.json, REVIEW.md)`);
