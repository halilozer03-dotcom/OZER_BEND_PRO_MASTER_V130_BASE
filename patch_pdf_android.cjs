const fs = require("fs");
const file = "src/pdf/pdf.js";
let s = fs.readFileSync(file, "utf8");

if (!s.includes("@capacitor/filesystem")) {
  s = `import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
` + s;
}

const start = s.indexOf("async function outputPdf");
const end = s.indexOf("export async function createPdf");

if (start < 0 || end < 0) {
  throw new Error("outputPdf veya createPdf bulunamadı");
}

const newOutput = `
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function outputPdf(doc, fileName, action = "save") {
  const blob = doc.output("blob");
  const isNative = !!window.Capacitor;

  if (isNative) {
    const safeName = fileName || "ozer-bend-pro.pdf";
    const base64 = await blobToBase64(blob);

    await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache
    });

    const uri = await Filesystem.getUri({
      path: safeName,
      directory: Directory.Cache
    });

    await Share.share({
      title: "ÖZER BEND PRO PDF",
      text: action === "print"
        ? "PDF hazır. Yazdırmak için açılan uygulamada Yazdır seç."
        : "ÖZER BEND PRO teknik çizim PDF",
      url: uri.uri,
      dialogTitle: action === "print" ? "PDF yazdır / aç" : "PDF paylaş"
    });

    return;
  }

  if (action === "print") {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    setTimeout(() => {
      try { w && w.print(); } catch (_) {}
    }, 500);
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
  }

  doc.save(fileName);
}

`;

s = s.slice(0, start) + newOutput + s.slice(end);
fs.writeFileSync(file, s);
console.log("PDF Android patch tamamlandı");
