import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src');
const graphPath = path.join(root, 'docs', 'graph.json');
const mapPath = path.join(root, 'docs', 'MAPA.md');
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(absolute));
    else if (extensions.includes(path.extname(entry.name))) files.push(absolute);
  }
  return files;
}

function relativeFile(absolute) {
  return path.relative(root, absolute).replaceAll(path.sep, '/');
}

function resolveImport(from, specifier, known) {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return null;
  const base = specifier.startsWith('@/')
    ? path.join(sourceRoot, specifier.slice(2))
    : path.resolve(path.dirname(from), specifier);
  const candidates = [base, ...extensions.map(extension => `${base}${extension}`), ...extensions.map(extension => path.join(base, `index${extension}`))];
  return candidates.find(candidate => known.has(candidate)) ?? null;
}

const absoluteFiles = await filesIn(sourceRoot);
const known = new Set(absoluteFiles);
const nodes = absoluteFiles.map(relativeFile).sort();
const edges = [];
const importPattern = /(?:from\s*|import\s*\()(['"])([^'"]+)\1/g;

for (const absolute of absoluteFiles) {
  const source = await readFile(absolute, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const target = resolveImport(absolute, match[2], known);
    if (target) edges.push({ from: relativeFile(absolute), to: relativeFile(target) });
  }
}

edges.sort((a, b) => `${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`));
const graph = { version: 1, scope: 'src', nodes, edges };
await mkdir(path.dirname(graphPath), { recursive: true });
await writeFile(graphPath, `${JSON.stringify(graph, null, 2)}\n`, 'utf8');

const outgoing = new Map(nodes.map(node => [node, 0]));
const incoming = new Map(nodes.map(node => [node, 0]));
for (const edge of edges) {
  outgoing.set(edge.from, (outgoing.get(edge.from) ?? 0) + 1);
  incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
}
const topIncoming = [...incoming.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
const layer = file => file.split('/').length > 2 ? file.split('/')[1] : '(raíz src)';
const counts = [...new Set(nodes.map(layer))].sort().map(name => [name, nodes.filter(node => layer(node) === name).length]);
const table = counts.map(([name, count]) => `| \`${name === '(raíz src)' ? 'src/' : `src/${name}/`}\` | ${count} |`).join('\n');
const hotNodes = topIncoming.map(([file, count]) => `| \`${file}\` | ${count} | ${outgoing.get(file) ?? 0} |`).join('\n');

const markdown = `# Mapa de dependencias de Truper Workspace

> Generado por \`pnpm graph\` desde los imports locales de \`src/\`. No editar a mano.

## Lectura rápida

- Nodos: **${nodes.length}** archivos TypeScript/TSX.
- Conexiones locales: **${edges.length}** imports entre archivos del proyecto.
- Entrada principal autenticada: \`src/app/[[...slug]]/page.tsx\`.
- Orquestador visual: \`src/modules/workspace/Workspace.tsx\`.
- Datos protegidos: \`src/modules/analytics/service.ts\` y \`src/modules/platform/actions.ts\`.

## Capas observadas

| Carpeta | Archivos |
|---|---:|
${table}

## Archivos más conectados

| Archivo | Entradas | Salidas |
|---|---:|---:|
${hotNodes}

## Cómo usarlo

1. Ejecuta \`pnpm graph\` después de mover módulos o cambiar imports importantes.
2. Abre \`docs/graph.json\` si necesitas buscar una conexión exacta.
3. Para entender una pantalla, sigue la ruta: página → servicio/acción → módulo → componente.
4. El grafo no reemplaza revisar contratos, migraciones, permisos ni pruebas.
`;
await writeFile(mapPath, markdown, 'utf8');
console.log(`Graph generated: ${nodes.length} nodes, ${edges.length} local edges`);
