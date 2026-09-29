import { mkdir, cp, copyFile, readFile, writeFile, rm, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');

const pages = ['index.html', 'demo.html', 'privacidad.html', 'aviso-legal.html'];
const sheets = ['styles.css', 'channel-preview.css', 'experience.css', 'demo.css', 'responsive.css'];
const plain = ['robots.txt', 'sitemap.xml'];

// Minificado conservador: solo quita comentarios y colapsa espacios fuera de cadenas.
// No reordena, no renombra y no toca el JavaScript, que se copia tal cual.
function minifyCss(css) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < css.length) {
    const c = css[i];
    if (quote) {
      out += c;
      if (c === '\\') { out += css[i + 1] ?? ''; i += 2; continue; }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; out += c; i += 1; continue; }
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (/\s/.test(c)) {
      const prev = out[out.length - 1];
      let j = i;
      while (j < css.length && /\s/.test(css[j])) j += 1;
      const next = css[j];
      // El espacio solo importa entre valores o selectores; junto a puntuacion sobra.
      // Excepcion: calc() exige espacios alrededor de + y -, asi que se conservan junto al +.
      const aroundPlus = prev === '+' || next === '+';
      if (prev && next && (aroundPlus || (!'{}:;,>~('.includes(prev) && !'{}:;,>~)'.includes(next)))) out += ' ';
      i = j;
      continue;
    }
    out += c;
    i += 1;
  }
  return out.trim();
}

async function folderSize(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? await folderSize(full) : (await stat(full)).size;
  }
  return total;
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of [...pages, ...plain]) await copyFile(path.join(root, file), path.join(output, file));
for (const folder of ['assets', 'js']) await cp(path.join(root, folder), path.join(output, folder), { recursive: true });

let saved = 0;
for (const sheet of sheets) {
  const source = await readFile(path.join(root, sheet), 'utf8');
  const min = minifyCss(source);
  saved += source.length - min.length;
  await writeFile(path.join(output, sheet), min);
}

const total = await folderSize(output);
console.log(`Landing estatica compilada en dist/. Sin dependencias ni conexion al proyecto principal.`);
console.log(`CSS minificado: ${(saved / 1024).toFixed(1)} KB menos. Total del build: ${(total / 1024).toFixed(0)} KB.`);
