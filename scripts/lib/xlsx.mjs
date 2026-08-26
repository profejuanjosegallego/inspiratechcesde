// Lector mínimo de .xlsx sin dependencias externas.
//
// Un .xlsx es un ZIP con XML dentro. Solo necesitamos: el texto de cada celda y
// el COLOR DE RELLENO (el plan de estudios marca en verde los cursos que el
// estudiante ya terminó), además de resolver las celdas combinadas.
import { inflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";

// ── ZIP ───────────────────────────────────────────────────────────────────────

/** Descomprime un .zip en memoria y devuelve { ruta: contenidoUtf8 }. */
function unzip(buf) {
  // El "end of central directory" está al final; puede llevar comentario, así
  // que lo buscamos hacia atrás desde el final.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("No es un ZIP válido (falta el end-of-central-directory).");

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16); // offset del central directory
  const files = {};

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);

    // El local header repite nombre/extra con longitudes propias: hay que
    // leerlas de ahí para ubicar el inicio real de los datos.
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);

    if (!name.endsWith("/")) {
      files[name] = method === 0 ? raw.toString("utf8") : inflateRawSync(raw).toString("utf8");
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

// ── XML ───────────────────────────────────────────────────────────────────────

const unescapeXml = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");

// OJO: los atributos se capturan de forma PEREZOSA. Con `[^>]*` (greedy) una
// celda vacía autocerrada `<c r="A7"/>` se come el contenido de la siguiente,
// porque tras fallar `/>` la alternativa `>` casa con el `>` de `/>`.
const TAG = (name) => new RegExp(`<${name}\\b([^>]*?)(?:/>|>([\\s\\S]*?)</${name}>)`, "g");

const attr = (s, name) => s.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;

/** "B12" → { col: 2, row: 12 } */
export function parseRef(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col, row: Number(m[2]) };
}

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Lee un .xlsx y devuelve sus hojas.
 * Cada hoja expone `cell(ref)` → { value, fill } con las celdas combinadas ya
 * resueltas (una celda dentro de un merge devuelve el valor de la esquina).
 */
export function readWorkbook(filePath) {
  const files = unzip(readFileSync(filePath));

  // Cadenas compartidas
  const shared = [];
  const ssXml = files["xl/sharedStrings.xml"];
  if (ssXml) {
    for (const si of ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      shared.push(
        [...si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unescapeXml(t[1])).join("")
      );
    }
  }

  // Colores del tema (los rellenos suelen referenciar theme="N")
  const themeColors = [];
  const themeXml = files["xl/theme/theme1.xml"];
  if (themeXml) {
    const scheme = themeXml.match(/<a:clrScheme[\s\S]*?<\/a:clrScheme>/)?.[0] ?? "";
    for (const m of scheme.matchAll(
      /<a:(?:srgbClr val="([0-9A-Fa-f]{6})"|sysClr[^>]*lastClr="([0-9A-Fa-f]{6})")/g
    )) {
      themeColors.push((m[1] || m[2]).toUpperCase());
    }
  }

  // Estilos: índice de estilo de celda → color de relleno
  const stylesXml = files["xl/styles.xml"] ?? "";
  const fillsBlock = stylesXml.match(/<fills[\s\S]*?<\/fills>/)?.[0] ?? "";
  const fills = [...fillsBlock.matchAll(/<fill>([\s\S]*?)<\/fill>/g)].map((f) => {
    if (!/patternType="solid"/.test(f[1])) return null;
    const fg = f[1].match(/<fgColor([^/>]*)\/?>/)?.[1] ?? "";
    const rgb = attr(fg, "rgb");
    if (rgb) return rgb.length === 8 ? rgb.slice(2).toUpperCase() : rgb.toUpperCase();
    const theme = attr(fg, "theme");
    if (theme !== null) return themeColors[Number(theme)] ?? `theme${theme}`;
    return null;
  });
  const cellXfs = stylesXml.match(/<cellXfs[\s\S]*?<\/cellXfs>/)?.[0] ?? "";
  const xfFill = [...cellXfs.matchAll(TAG("xf"))].map((m) => Number(attr(m[1], "fillId") ?? 0));

  // Nombre de hoja → archivo
  const rels = {};
  for (const m of (files["xl/_rels/workbook.xml.rels"] ?? "").matchAll(/<Relationship([^>]*)\/>/g)) {
    rels[attr(m[1], "Id")] = attr(m[1], "Target").replace(/^\/?xl\//, "");
  }

  const sheets = [];
  for (const m of (files["xl/workbook.xml"] ?? "").matchAll(/<sheet([^>]*)\/>/g)) {
    const name = unescapeXml(attr(m[1], "name"));
    const target = rels[attr(m[1], "r:id")];
    const xml = files[`xl/${target}`];
    if (!xml) continue;

    const cells = new Map();
    for (const row of xml.matchAll(TAG("row"))) {
      for (const c of (row[2] ?? "").matchAll(TAG("c"))) {
        const ref = attr(c[1], "r");
        if (!ref) continue;
        const type = attr(c[1], "t");
        const style = Number(attr(c[1], "s") ?? 0);
        const body = c[2] ?? "";

        let value = "";
        if (type === "s") {
          const v = body.match(/<v>([\s\S]*?)<\/v>/);
          value = v ? shared[Number(v[1])] ?? "" : "";
        } else if (type === "inlineStr") {
          value = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
            .map((t) => unescapeXml(t[1]))
            .join("");
        } else {
          const v = body.match(/<v>([\s\S]*?)<\/v>/);
          value = v ? unescapeXml(v[1]) : "";
        }
        cells.set(ref, { value: value.trim(), fill: fills[xfFill[style] ?? 0] ?? null });
      }
    }

    // Celdas combinadas: mapear cada celda cubierta a la esquina superior izq.
    const merges = [];
    for (const mc of (xml.match(/<mergeCells[\s\S]*?<\/mergeCells>/)?.[0] ?? "").matchAll(
      /<mergeCell ref="([A-Z]+\d+):([A-Z]+\d+)"\/>/g
    )) {
      merges.push({ from: parseRef(mc[1]), to: parseRef(mc[2]), anchor: mc[1] });
    }

    // OJO: el VALOR y el RELLENO se resuelven por separado. Una celda cubierta
    // por un merge existe en el XML (a veces con su propio relleno) pero SIN
    // valor: si devolviéramos esa celda tal cual solo por tener `fill`, el
    // grado de todo el bloque se perdería. El valor siempre viene de la
    // esquina del merge; el relleno, de la celda concreta.
    const anchorOf = (ref) => {
      const { col, row } = parseRef(ref);
      for (const m2 of merges) {
        if (col >= m2.from.col && col <= m2.to.col && row >= m2.from.row && row <= m2.to.row) {
          return m2.anchor;
        }
      }
      return null;
    };

    const cell = (ref) => {
      const direct = cells.get(ref) ?? { value: "", fill: null };
      if (direct.value !== "") return direct;
      const anchor = anchorOf(ref);
      if (!anchor || anchor === ref) return direct;
      const src = cells.get(anchor);
      return { value: src?.value ?? "", fill: direct.fill ?? src?.fill ?? null };
    };

    sheets.push({ name: name.trim(), cell, cells, merges });
  }

  return { sheets, sheet: (n) => sheets.find((s) => s.name === n.trim()) };
}
