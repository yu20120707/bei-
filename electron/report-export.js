import fs from "node:fs/promises";
import {
  AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from "docx";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function reportHtml(wrongWords) {
  const rows = wrongWords.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.word)}</td><td>${escapeHtml(item.definition)}</td><td>${escapeHtml(item.chosen)}</td></tr>`).join("");
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>
    @page { size: A4; margin: 18mm; } body { font-family: "Microsoft YaHei", sans-serif; color: #241f17; font-size: 10.5pt; }
    h1 { margin: 0 0 6px; font-size: 22pt; } p { margin: 0 0 18px; color: #615949; } table { width: 100%; border-collapse: collapse; }
    th { background: #b48800; color: #fff; text-align: left; } th, td { padding: 8px; border: 1px solid #ded8ca; vertical-align: top; } td:first-child { width: 8%; text-align: center; }
  </style><body><h1>本轮错题</h1><p>共 ${wrongWords.length} 个。请根据正确释义重新复习。</p><table><thead><tr><th>#</th><th>英文</th><th>正确中文</th><th>你的选择</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

const cell = (text, options = {}) => new TableCell({
  width: { size: options.width ?? 25, type: WidthType.PERCENTAGE },
  shading: options.header ? { fill: "B48800" } : undefined,
  children: [new Paragraph({ children: [new TextRun({ text: String(text), bold: Boolean(options.header), color: options.header ? "FFFFFF" : "241F17", font: "Microsoft YaHei" })] })],
});

export async function writeDocxReport(filePath, wrongWords) {
  const rows = [new TableRow({ children: [cell("#", { header: true, width: 8 }), cell("英文", { header: true, width: 24 }), cell("正确中文", { header: true, width: 34 }), cell("你的选择", { header: true, width: 34 })] })];
  wrongWords.forEach((item, index) => rows.push(new TableRow({ children: [cell(index + 1, { width: 8 }), cell(item.word, { width: 24 }), cell(item.definition, { width: 34 }), cell(item.chosen, { width: 34 })] })));
  const document = new Document({ sections: [{ children: [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "本轮错题", bold: true, size: 36, font: "Microsoft YaHei", color: "241F17" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 }, children: [new TextRun({ text: `共 ${wrongWords.length} 个，请根据正确释义重新复习。`, font: "Microsoft YaHei", color: "615949" })] }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
  ] }] });
  await fs.writeFile(filePath, await Packer.toBuffer(document));
}
