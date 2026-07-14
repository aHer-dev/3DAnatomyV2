// set-muscle-latin.mjs
// Setzt kuratierte Terminologia-Anatomica-Latein-Namen (labels.la) für die 54
// sichtbaren neuen Muskel-Teile (Gruppe muscles, Auto-generiert). Ersetzt die
// fehleranfällige Laufzeit-Synthese durch geprüfte Namen. Seiten-neutral für
// Muskeln (Musculus = maskulin → App hängt dexter/sinister korrekt an); bei den
// 2 fehlklassifizierten Bändern (Ligamentum = neutrum) die Seitenform
// dextrum/sinistrum fest eingebaut, da die App nur maskuline Seiten anhängt.
//
// Schlüssel = FMA-ID (stabil). validation_status='latin_manual' markiert
// menschlich kuratierte, noch fachlich zu prüfende Namen.
//
//   node scripts/set-muscle-latin.mjs [--dry-run]

import fs from 'fs';
import path from 'path';

const DRY = process.argv.includes('--dry-run');
const META_PATH = path.join(process.cwd(), 'public/data/meta.json');

// FMA-ID -> Latein (seiten-neutral, außer bei Bändern)
const LATIN = {
  // ganze Muskeln (Musculus <name>) — App hängt dexter/sinister an
  fma46836: 'Musculus buccinator', fma46835: 'Musculus buccinator',
  fma46797: 'Musculus corrugator supercilii', fma46796: 'Musculus corrugator supercilii',
  fma46830: 'Musculus depressor anguli oris', fma46829: 'Musculus depressor anguli oris',
  fma46818: 'Musculus depressor labii inferioris', fma46817: 'Musculus depressor labii inferioris',
  fma55609: 'Musculus depressor septi nasi', fma55608: 'Musculus depressor septi nasi',
  fma46760: 'Musculus frontalis', fma46759: 'Musculus frontalis',
  fma13359: 'Musculus latissimus dorsi', fma13358: 'Musculus latissimus dorsi',
  fma46824: 'Musculus levator anguli oris', fma46823: 'Musculus levator anguli oris',
  fma46807: 'Musculus levator labii superioris', fma46806: 'Musculus levator labii superioris',
  fma46804: 'Musculus levator labii superioris alaeque nasi', fma46803: 'Musculus levator labii superioris alaeque nasi',
  fma49013: 'Musculus pterygoideus medialis', fma49012: 'Musculus pterygoideus medialis',
  fma46827: 'Musculus mentalis', fma46826: 'Musculus mentalis',
  fma55607: 'Musculus nasalis', fma55606: 'Musculus nasalis',
  fma46762: 'Musculus occipitalis', fma46761: 'Musculus occipitalis',
  fma55611: 'Musculus procerus', fma55610: 'Musculus procerus',
  fma13378: 'Musculus rectus abdominis', fma13377: 'Musculus rectus abdominis',
  fma46840: 'Musculus risorius', fma46839: 'Musculus risorius',
  fma49008: 'Musculus temporalis', fma49007: 'Musculus temporalis',
  fma46764: 'Musculus temporoparietalis', fma46763: 'Musculus temporoparietalis',
  fma46600: 'Musculus thyroarytenoideus', fma46599: 'Musculus thyroarytenoideus',
  fma22345: 'Musculus transversus abdominis', fma22344: 'Musculus transversus abdominis',
  fma46813: 'Musculus zygomaticus major', fma46812: 'Musculus zygomaticus major',
  fma46815: 'Musculus zygomaticus minor', fma46814: 'Musculus zygomaticus minor',
  fma13892: 'Musculus obliquus internus abdominis',
  fma46841: 'Musculus orbicularis oris',
  // Teile (Pars … musculi …) — App nominativiert + hängt Seite an
  fma46783: 'Pars orbitalis musculi orbicularis oculi', fma46782: 'Pars orbitalis musculi orbicularis oculi',
  fma46786: 'Pars palpebralis musculi orbicularis oculi', fma46785: 'Pars palpebralis musculi orbicularis oculi',
  // Bänder (fehlklassifiziert in muscles) — Seite fest, neutrum
  fma57086: 'Ligamentum stylomandibulare sinistrum',
  fma57084: 'Ligamentum stylomandibulare dextrum',
};

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
let set = 0, notFound = [];
const applied = new Set();

for (const e of meta) {
  const fma = (e.info?.links?.fma || '').toLowerCase();
  if (!fma || !(fma in LATIN)) continue;
  const la = LATIN[fma];
  if (!DRY) {
    e.labels.la = la;
    if (e.meta) e.meta.validation_status = 'latin_manual';
  }
  applied.add(fma);
  set++;
}
for (const fma of Object.keys(LATIN)) if (!applied.has(fma)) notFound.push(fma);

if (!DRY) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + '\n');
}

console.log(`${DRY ? '[DRY-RUN] ' : ''}labels.la gesetzt: ${set} / ${Object.keys(LATIN).length}`);
if (notFound.length) console.log('NICHT gefunden in meta.json:', notFound.join(', '));
