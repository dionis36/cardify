// lib/pdf.ts

import jsPDF from "jspdf";

export function downloadPNG(stage: any, filename: string = "card.png") {
  const dataURL = stage.toDataURL({ pixelRatio: 3 });
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  link.click();
}

export function downloadPDF(stage: any, filename: string = "card.pdf") {
  const dataURL = stage.toDataURL({ pixelRatio: 3 });
  const pdf = new jsPDF({
    orientation: stage.width() > stage.height() ? "landscape" : "portrait",
    unit: "px",
    format: [stage.width(), stage.height()]
  });
  pdf.addImage(dataURL, "PNG", 0, 0, stage.width(), stage.height());
  pdf.save(filename);
}
