// Shared building blocks for the GymFlow weekly reports (same look as the Week 1–6 reports).
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, Header, Footer,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, LevelFormat, HeadingLevel,
  TabStopType, PageNumber, PageBreak,
} = require('docx');

const NAVY = '1F3A5F';
const BLUE = '2E75B6';
const GREY = '595959';
const RULE = 'BFCBDA';
const ZEBRA = 'F7F9FC';
const FONT = 'Calibri';
const CONTENT_W = 9026; // A4 width 11906 minus 2 × 1440 margins
const IMG = path.join(__dirname, 'img');

const run = (text, opts = {}) => new TextRun({ text, font: FONT, ...opts });

// Text with **bold** parts, e.g. "the **revenue** card".
function rich(text, base = {}) {
  return String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith('**') ? run(part.slice(2, -2), { ...base, bold: true }) : run(part, base));
}

const p = (text, opts = {}) => new Paragraph({ spacing: { after: 120, line: 276 }, children: rich(text), ...opts });
const lead = (text) => new Paragraph({ spacing: { after: 120, line: 276 }, keepNext: true, children: [run(text, { bold: true })] });
const why = (text) => new Paragraph({ spacing: { after: 120, line: 276 }, children: [run('Why: ', { bold: true, color: BLUE }), ...rich(text)] });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run(text)] });
const note = (text) => new Paragraph({ spacing: { before: 60, after: 160 }, children: rich(text, { italics: true, color: GREY, size: 18 }) });

// Every numbered list gets its own numbering, so it starts at 1.
const numberingConfigs = [];
function list(items) {
  const reference = `numbers-${numberingConfigs.length + 1}`;
  numberingConfigs.push({
    reference,
    levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
  });
  return items.map((text) => new Paragraph({ numbering: { reference, level: 0 }, spacing: { after: 60 }, children: rich(text) }));
}
const bullets = (items) => items.map((text) =>
  new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: rich(text) }));

const line = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const cellBorders = { top: line, bottom: line, left: line, right: line };
const cellMargins = { top: 70, bottom: 70, left: 110, right: 110 };

function cell(text, width, { header = false, fill, bold = false, mono = false, size = 20, color } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    margins: cellMargins,
    verticalAlign: VerticalAlign.CENTER,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: header ? NAVY : fill },
    children: [new Paragraph({ children: rich(text, { size, bold: header || bold, color: header ? 'FFFFFF' : color, font: mono ? 'Consolas' : FONT }) })],
  });
}

// rows[0] is the header row. Options: boldFirst / boldLast column, monospace columns, font size,
// statusCol: a column whose PASS / FAIL is coloured.
function table(widths, rows, { boldFirst = false, boldLast = false, mono = [], size = 20, statusCol = -1 } = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((cells, r) => new TableRow({
      tableHeader: r === 0,
      cantSplit: true,
      children: cells.map((text, c) => cell(text, widths[c], {
        header: r === 0,
        fill: r % 2 === 0 ? ZEBRA : 'FFFFFF',
        bold: (boldFirst && c === 0) || (boldLast && c === cells.length - 1) || (r > 0 && c === statusCol),
        color: r > 0 && c === statusCol ? (String(text).startsWith('PASS') ? '2E7D32' : 'C62828') : undefined,
        mono: mono.includes(c),
        size,
      })),
    })),
  });
}

// Two-column "field / value" table without a dark header row (record sheets).
function sheet(rows, widths = [2800, 6226]) {
  return new Table({
    width: { size: widths[0] + widths[1], type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(([field, value], r) => new TableRow({
      cantSplit: true,
      children: [
        cell(field, widths[0], { fill: 'EAF0F7', bold: true }),
        cell(value, widths[1], { fill: r % 2 === 0 ? 'FFFFFF' : ZEBRA }),
      ],
    })),
  });
}

const gap = () => new Paragraph({ spacing: { after: 120 }, children: [] });

// Monospace block in a light box (test output, logs).
function code(lines) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      borders: cellBorders,
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F2F5F9' },
      children: lines.map((l) => new Paragraph({ children: [new TextRun({ text: l, font: 'Consolas', size: 18, color: NAVY })] })),
    })] })],
  });
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

let figure = 0;
// An image scaled to `widthIn` inches, followed by its numbered caption.
function fig(file, widthIn, caption) {
  const full = path.join(IMG, file);
  const { w, h } = pngSize(full);
  const width = Math.round(widthIn * 96);
  const height = Math.round((width * h) / w);
  figure += 1;
  return [
    new Paragraph({ keepNext: true, alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new ImageRun({ type: 'png', data: fs.readFileSync(full), transformation: { width, height } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 }, children: [run(`Figure ${figure} – ${caption}`, { italics: true, color: GREY, size: 18 })] }),
  ];
}

function coverPage({ week, stage, date, status }) {
  const info = new Table({
    width: { size: 7000, type: WidthType.DXA },
    columnWidths: [2800, 4200],
    alignment: AlignmentType.CENTER,
    rows: [
      ['Report information', ''], ['Student name', ''], ['Student number', ''], ['Supervisor', ''],
      ['Week', `Week ${week} of 9`], ['Stage', stage], ['Report date', date], ['Status', status],
    ].map((cells, r) => new TableRow({
      tableHeader: r === 0,
      cantSplit: true,
      children: cells.map((text, c) => cell(text, c === 0 ? 2800 : 4200, { header: r === 0, fill: r % 2 === 0 ? ZEBRA : 'FFFFFF', bold: c === 0 })),
    })),
  });
  return [
    new Paragraph({ spacing: { after: 1400 }, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [run('ALTINBAŞ UNIVERSITY', { bold: true, color: GREY, size: 26, characterSpacing: 40 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [run('Software Engineering – Graduation Project', { color: GREY, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [run('GymFlow', { bold: true, color: NAVY, size: 64 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 }, children: [run('A Web-Based Gym Membership, Class Management and Workout Tracking System', { color: GREY, size: 24 })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 700 },
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 12 }, bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 12 } },
      children: [run(`Weekly Progress Report – Week ${week}`, { bold: true, color: NAVY, size: 34 }), run('   |   ', { color: BLUE, size: 24 }), run(stage, { color: BLUE, size: 24 })],
    }),
    info,
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

const smallGrey = { font: FONT, size: 18, color: GREY };

function buildDocument({ headerText, title, children }) {
  return new Document({
    creator: 'GymFlow',
    title,
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 30, bold: true, color: NAVY },
          paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, keepLines: true, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 4 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 24, bold: true, color: BLUE },
          paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, keepLines: true, outlineLevel: 1 } },
      ],
    },
    numbering: {
      config: [
        { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        ...numberingConfigs,
      ],
    },
    sections: [{
      properties: {
        titlePage: true,
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1300, left: 1440, header: 708, footer: 708 } },
      },
      headers: {
        first: new Header({ children: [new Paragraph({ children: [] })] }),
        default: new Header({ children: [new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } },
          children: [new TextRun({ text: 'GymFlow', font: FONT, size: 18, bold: true, color: NAVY }), new TextRun({ text: `\t${headerText}`, ...smallGrey })],
        })] }),
      },
      footers: {
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Page ', ...smallGrey }), new TextRun({ children: [PageNumber.CURRENT], ...smallGrey })] })] }),
      },
      children,
    }],
  });
}

async function writeDocument(doc, out) {
  fs.writeFileSync(out, await Packer.toBuffer(doc));
  console.log(`written ${out} (${figure} figures)`);
}

module.exports = { run, rich, p, lead, why, note, h1, h2, bullets, list, table, sheet, gap, code, fig, cell, coverPage, buildDocument, writeDocument, NAVY, BLUE, GREY, CONTENT_W };
