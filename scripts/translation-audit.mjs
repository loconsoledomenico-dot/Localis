import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const GUIDES_DIR = path.join(ROOT, 'src/content/guides');
const SCRIPTS_DIR = path.join(ROOT, 'src/content/scripts');
const SOURCE_MAP = path.join(ROOT, 'docs/i18n/source-map.json');
const TARGET_LANGS = ['fr', 'pl'];
const BREAK_TOLERANCE = 2; // differenza ammessa nel conteggio <break>

// ── helper puri (testati) ───────────────────────────────────────────────
export function countBreaks(s) {
  return (String(s).match(/<break\b/g) || []).length;
}
export function looksUntranslated(src, candidate) {
  if (!candidate || candidate.trim().length < 8) return false;
  return src.trim() === candidate.trim();
}
export function expectedScriptName(srcName, lang) {
  if (srcName.endsWith('-it.txt')) return srcName.replace(/-it\.txt$/, `-${lang}.txt`);
  return srcName.replace(/\.txt$/, `-${lang}.txt`);
}

// ── frontmatter ─────────────────────────────────────────────────────────
function readFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`no frontmatter: ${file}`);
  return yaml.load(m[1]);
}

// campi scalari che, se hanno _it, richiedono _fr/_pl
const SCALAR_BASES = ['title', 'subtitle', 'route_mode', 'accessibility', 'needs', 'use_case_intro'];

function checkGuide(slug, data, sourceMap, problems) {
  const add = (msg) => problems.push(`[${slug}] ${msg}`);

  for (const lang of TARGET_LANGS) {
    // scalari top-level
    for (const base of SCALAR_BASES) {
      const it = data[`${base}_it`];
      if (it && !String(data[`${base}_${lang}`] || '').trim()) add(`manca ${base}_${lang}`);
      if (it && looksUntranslated(it, data[`${base}_${lang}`])) add(`${base}_${lang} = IT (non tradotto)`);
    }
    // seo.description
    const seoIt = data.seo?.description_it;
    const seoX = data.seo?.[`description_${lang}`];
    if (seoIt && !String(seoX || '').trim()) add(`manca seo.description_${lang}`);
    if (seoX && seoX.length > 160) add(`seo.description_${lang} > 160 (${seoX.length})`);
    // narrator.bio
    if (data.narrator?.bio_it) {
      if (!String(data.narrator[`bio_${lang}`] || '').trim()) add(`manca narrator.bio_${lang}`);
    }
    // capitoli
    (data.chapters || []).forEach((ch, i) => {
      if (ch.title_it && !String(ch[`title_${lang}`] || '').trim()) add(`manca chapters[${i}].title_${lang}`);
      if (ch.title_it && looksUntranslated(ch.title_it, ch[`title_${lang}`])) add(`chapters[${i}].title_${lang} = IT`);
    });
    // script files
    const entry = sourceMap.guides[slug];
    if (!entry) { add(`assente da source-map.json`); continue; }
    for (const src of entry.script) {
      if (src.includes('__')) { add(`source-map PENDING: ${src}`); continue; }
      const want = expectedScriptName(src, lang);
      const wantPath = path.join(SCRIPTS_DIR, want);
      if (!fs.existsSync(wantPath)) { add(`manca script ${want}`); continue; }
      const srcTxt = fs.readFileSync(path.join(SCRIPTS_DIR, src), 'utf8');
      const dstTxt = fs.readFileSync(wantPath, 'utf8');
      if (dstTxt.trim().length < srcTxt.trim().length * 0.4) add(`script ${want} troppo corto vs IT`);
      if (Math.abs(countBreaks(srcTxt) - countBreaks(dstTxt)) > BREAK_TOLERANCE)
        add(`script ${want}: <break> ${countBreaks(dstTxt)} vs IT ${countBreaks(srcTxt)}`);
    }
  }
}

export function runAudit() {
  const sourceMap = JSON.parse(fs.readFileSync(SOURCE_MAP, 'utf8'));
  const problems = [];
  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.mdx'));
  for (const f of files) {
    const data = readFrontmatter(path.join(GUIDES_DIR, f));
    checkGuide(data.slug || f.replace(/\.mdx$/, ''), data, sourceMap, problems);
  }
  const total = files.length;
  const dirty = new Set(problems.map((p) => p.match(/^\[(.+?)\]/)[1])).size;
  console.log(`Guide pulite: ${total - dirty}/${total}`);
  if (problems.length) {
    console.log(`\n${problems.length} problemi:`);
    for (const p of problems) console.log('  - ' + p);
    process.exitCode = 1;
  } else {
    console.log('Audit FR/PL verde ✅');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runAudit();
