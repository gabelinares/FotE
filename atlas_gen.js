// atlas_gen.js
export function composeMessageGOL(phrase, atlas, opts = {}) {
  const glyphW = (atlas.grid_size && atlas.grid_size[0]) || 5;
  const glyphH = (atlas.grid_size && atlas.grid_size[1]) || 5;
  const glyphsPerRow = opts.glyphsPerRow ?? 8;
  const colSpacing = opts.colSpacing ?? 1;
  const rowSpacing = opts.rowSpacing ?? 1;
  const glyphMap = atlas.glyphs;

  const letters = phrase.toUpperCase().split('');
  const rows = [];
  let lineGlyphs = [];
  for (const ch of letters) {
    if (ch === ' ') {
      lineGlyphs.push(Array.from({ length: glyphH }, () => '.'.repeat(glyphW)));
    } else if (glyphMap[ch]) {
      lineGlyphs.push(glyphMap[ch]);
    } else {
      lineGlyphs.push(Array.from({ length: glyphH }, () => '.'.repeat(glyphW)));
    }
    if (lineGlyphs.length === glyphsPerRow) { rows.push(lineGlyphs); lineGlyphs = []; }
  }
  if (lineGlyphs.length) rows.push(lineGlyphs);

  const out = [];
  rows.forEach((glyphRow, ridx) => {
    for (let r=0;r<glyphH;r++){
      let line='';
      glyphRow.forEach((g, idx) => {
        line += g[r];
        if (idx < glyphRow.length - 1) line += '.'.repeat(colSpacing);
      });
      out.push(line);
    }
    if (ridx < rows.length-1) for (let i=0;i<rowSpacing;i++) out.push('.'.repeat(out[out.length-1].length));
  });
  return out.join('\n');
}
export function buildGolFile(phrase, atlas, opts){ return composeMessageGOL(phrase, atlas, opts) + '\n'; }
