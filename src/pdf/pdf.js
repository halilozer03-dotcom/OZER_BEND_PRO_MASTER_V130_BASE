import { jsPDF } from "jspdf";

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mm(value) {
  return `${safeNumber(value).toFixed(1)} mm`;
}

function makeFileName(data) {
  const name = data?.profileType === "l" ? "kosebent-l" : "kapi-profili";
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `ozer-bend-pro-${name}-${stamp}.pdf`;
}

async function outputPdf(doc, fileName, action = "save") {
  const blob = doc.output("blob");

  if (action === "print") {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (_) {
          doc.save(fileName);
        }
        setTimeout(() => {
          URL.revokeObjectURL(url);
          iframe.remove();
        }, 60000);
      }, 350);
    };
    return;
  }

  if (action === "share") {
    try {
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          files: [file],
          title: "ÖZER BEND PRO PDF",
          text: "ÖZER BEND PRO teknik çizim PDF"
        });
        return;
      }
    } catch (_) {}
    await outputPdf(doc, fileName, "print");
    return;
  }

  doc.save(fileName);
}

export async function createPdf({ data, result, lang, action = "save" }) {
  const doc = new jsPDF("landscape", "mm", "a4");

  const dark = [15, 18, 24];
  const ink = [15, 23, 42];
  const red = [185, 28, 28];

  const isLProfile = data.profileType === "l";

  const A = safeNumber(data.A);
  const B = safeNumber(data.B);
  const C = safeNumber(data.C);
  const D = safeNumber(data.D);
  const EN = safeNumber(data.EN);
  const H = safeNumber(data.H);
  const kalip = data.kalip || "V16";
  const upperDie = data.upperDie || "R8";
  const machine = data.machine || "DURMA Easy";
  const material = data.material || "DKP";
  const thickness = safeNumber(data.thickness, 2);
  const angle = safeNumber(data.aci, 90);
  const kesilecekEn = safeNumber(result.kesilecekEn);
  const kesilecekBoy = result.kesilecekBoy == null ? null : safeNumber(result.kesilecekBoy);
  const tarih = new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fileName = makeFileName(data);

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 210, "F");

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(3, 3, 291, 204);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.setTextColor(0, 0, 0);
  doc.text("ÖZER", 88, 18);
  doc.setTextColor(...red);
  doc.text("BEND", 126, 18);
  doc.setTextColor(0, 0, 0);
  doc.text("PRO", 170, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("PROFESYONEL BÜKÜM ÇÖZÜMLERİ", 112, 25);

  doc.setDrawColor(120, 120, 120);
  doc.line(7, 30, 290, 30);

  const infoY = 34;
  const cells = [
    ["PROFİL", isLProfile ? "KÖŞEBENT L" : "KAPI PROFİLİ"],
    ["MALZEME", material],
    ["KALINLIK", `${thickness.toFixed(2)} mm`],
    ["MAKİNE", machine],
    ["ALT KALIP", kalip],
    ["ÜST KALIP", upperDie],
    ["AÇI", `${angle}°`],
    ["TARİH / SAAT", tarih]
  ];

  let x0 = 7;
  const widths = [38, 32, 34, 42, 38, 38, 25, 66];

  doc.setFontSize(8);
  doc.setTextColor(...ink);

  cells.forEach((c, i) => {
    const w = widths[i];
    doc.line(x0, 31, x0, 49);
    doc.setFont("helvetica", "normal");
    doc.text(c[0], x0 + 3, infoY + 4);
    doc.setFont("helvetica", "bold");
    doc.text(String(c[1]), x0 + 3, infoY + 12);
    x0 += w;
  });
  doc.line(290, 31, 290, 49);
  doc.line(7, 50, 290, 50);

  if (isLProfile) {
    const cx = 112, cy = 145;
    const scale = Math.min(1.4, 100 / Math.max(1, A), 70 / Math.max(1, B));
    const ax = cx + A * scale;
    const ay = cy;
    const theta = (180 - Math.max(15, Math.min(180, angle))) * Math.PI / 180;
    const bx = cx + Math.cos(theta) * B * scale;
    const by = cy - Math.sin(theta) * B * scale;

    doc.setDrawColor(0, 0, 0);
    doc.setLineCap("round");
    doc.setLineJoin("round");
    doc.setLineWidth(3.2);
    doc.line(bx, by, cx, cy);
    doc.line(cx, cy, ax, ay);

    doc.setLineWidth(0.35);
    doc.setDrawColor(0, 0, 0);
    doc.text(`A: ${A}`, (cx + ax) / 2, cy + 16, { align: "center" });
    doc.text(`B: ${B}`, (cx + bx) / 2 - 18, (cy + by) / 2, { align: "center" });

    doc.setTextColor(...red);
    doc.setFont("helvetica", "bold");
    doc.text(`${angle}°`, cx + 15, cy - 12);
  } else {
    const x = 55;
    const y = 152;
    const w = 187;
    const h = 58;
    const ayak = 24;

    doc.setDrawColor(0, 0, 0);
    doc.setLineCap("round");
    doc.setLineJoin("round");
    doc.setLineWidth(3.4);

    doc.line(x, y, x, y - h);
    doc.line(x, y - h, x + w, y - h);
    doc.line(x + w, y - h, x + w, y);
    doc.line(x, y, x + ayak, y);
    doc.line(x + w - ayak, y, x + w, y);

    doc.setLineWidth(0.35);
    doc.setDrawColor(0, 0, 0);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    doc.line(x, y - h - 14, x + w, y - h - 14);
    doc.line(x, y - h - 19, x, y - h - 9);
    doc.line(x + w, y - h - 19, x + w, y - h - 9);
    doc.text(`${EN.toFixed(2)}`, x + w / 2, y - h - 17, { align: "center" });

    doc.line(x - 23, y, x - 23, y - h);
    doc.line(x - 27, y, x - 19, y);
    doc.line(x - 27, y - h, x - 19, y - h);
    doc.text(`${B.toFixed(2)}`, x - 43, y - h / 2 + 2);
    doc.setTextColor(...red);
    doc.text("B", x - 54, y - h / 2 + 2);

    doc.setTextColor(...ink);
    doc.line(x + w + 23, y, x + w + 23, y - h);
    doc.line(x + w + 19, y, x + w + 27, y);
    doc.line(x + w + 19, y - h, x + w + 27, y - h);
    doc.text(`${C.toFixed(2)}`, x + w + 30, y - h / 2 + 2);
    doc.setTextColor(...red);
    doc.text("C", x + w + 45, y - h / 2 + 2);

    doc.setTextColor(...ink);
    doc.line(x, y + 15, x + ayak, y + 15);
    doc.line(x, y + 10, x, y + 20);
    doc.line(x + ayak, y + 10, x + ayak, y + 20);
    doc.text(`${A.toFixed(2)}`, x + ayak / 2, y + 13, { align: "center" });
    doc.setTextColor(...red);
    doc.text("A", x + ayak / 2, y + 25, { align: "center" });

    doc.setTextColor(...ink);
    doc.line(x + w - ayak, y + 15, x + w, y + 15);
    doc.line(x + w - ayak, y + 10, x + w - ayak, y + 20);
    doc.line(x + w, y + 10, x + w, y + 20);
    doc.text(`${D.toFixed(2)}`, x + w - ayak / 2, y + 13, { align: "center" });
    doc.setTextColor(...red);
    doc.text("D", x + w - ayak / 2, y + 25, { align: "center" });

    doc.setTextColor(...ink);
    doc.setFontSize(10);
    doc.text("90°", x + 12, y - h + 16);
  }

  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.25);
  doc.rect(7, 174, 283, 27);

  const summary = [
    ["A", mm(A)],
    ["B", mm(B)],
    ["C", mm(C)],
    ["D", mm(D)],
    ["KESİLECEK EN", mm(kesilecekEn)],
    ["KESİLECEK BOY", kesilecekBoy == null ? "-" : mm(kesilecekBoy)]
  ];

  const sx = [18, 55, 92, 129, 171, 228];
  doc.setFont("helvetica", "bold");
  summary.forEach((s, i) => {
    doc.setTextColor(i < 4 ? red[0] : 0, i < 4 ? red[1] : 0, i < 4 ? red[2] : 0);
    doc.setFontSize(i < 4 ? 14 : 9);
    doc.text(s[0], sx[i], 185, { align: "center" });
    doc.setTextColor(i >= 4 ? red[0] : 0, i >= 4 ? red[1] : 0, i >= 4 ? red[2] : 0);
    doc.setFontSize(i >= 4 ? 13 : 8);
    doc.text(s[1], sx[i], 195, { align: "center" });
    if (i > 0 && i < 6) {
      doc.setDrawColor(120, 120, 120);
      doc.line(sx[i] - 20, 178, sx[i] - 20, 198);
    }
  });

  await outputPdf(doc, fileName, action);
}
