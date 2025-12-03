// lib/pdf.ts
// Simplified export functionality with professional defaults

import jsPDF from "jspdf";
import Konva from "konva";
import { ExportOptions } from "@/types/template";
import { mmToPixels, pixelsToMm, createBleedCanvas } from "./exportUtils";

/**
 * Calculate pixel ratio for export based on target DPI
 * @param dpi - Target DPI (72, 150, 300, etc.)
 * @returns Pixel ratio multiplier
 */
export function calculatePixelRatio(dpi: number): number {
  const baseDPI = 72; // Standard screen DPI
  return dpi / baseDPI;
}

/**
 * Export stage as PNG with custom options
 * @param stage - Konva stage to export
 * @param options - Export options
 */
export async function exportAsPNG(
  stage: Konva.Stage,
  options: ExportOptions
): Promise<void> {
  // Enforce High Quality for PNG
  // Since the template is defined at 300 DPI (1050x600), we export at 1:1 ratio
  const pixelRatio = 1;
  const fileName = options.fileName || "card.png";

  // PNG is digital/preview, so NO bleed
  // We explicitly set the crop area to the template dimensions to avoid extra whitespace
  const config: any = { pixelRatio };

  if (options.templateWidth && options.templateHeight) {
    config.x = 0;
    config.y = 0;
    config.width = options.templateWidth;
    config.height = options.templateHeight;
  }

  const dataURL = stage.toDataURL(config);

  // Trigger download
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
  link.click();
}

/**
 * Export stage as PDF with custom options
 * @param stage - Konva stage to export
 * @param options - Export options
 */
export async function exportAsPDF(
  stage: Konva.Stage,
  options: ExportOptions
): Promise<void> {
  // Enforce High Quality for PDF
  const dpi = 300;
  const fileName = options.fileName || "card.pdf";
  const bleedMm = 3; // Standard 3mm bleed

  // Create canvas with bleed zone for Print
  // We pass baseDpi=300 because our template is defined at 300 DPI
  const bleedCanvas = await createBleedCanvas(stage, bleedMm, dpi, 300);
  const dataURL = bleedCanvas.toDataURL("image/png");

  // Calculate dimensions for PDF
  // We assume the template pixels correspond to 300 DPI
  const templateWidth = options.templateWidth || stage.width();
  const templateHeight = options.templateHeight || stage.height();

  const cardWidthMm = pixelsToMm(templateWidth, 300);
  const cardHeightMm = pixelsToMm(templateHeight, 300);

  // Add bleed to dimensions
  const totalWidthMm = cardWidthMm + (bleedMm * 2);
  const totalHeightMm = cardHeightMm + (bleedMm * 2);

  // Create A4 PDF
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const a4Width = 297; // Landscape A4
  const a4Height = 210;

  // Calculate center position
  const x = (a4Width - totalWidthMm) / 2;
  const y = (a4Height - totalHeightMm) / 2;

  // Add image to PDF
  pdf.addImage(dataURL, "PNG", x, y, totalWidthMm, totalHeightMm);

  // Save PDF
  const finalFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  pdf.save(finalFileName);
}

/**
 * Main export function that handles all formats
 * @param stage - Konva stage to export
 * @param options - Export options
 */
export async function exportWithOptions(
  stage: Konva.Stage,
  options: ExportOptions
): Promise<void> {
  // Validate stage
  if (!stage) {
    throw new Error("Stage is required for export");
  }

  // Save current stage state (zoom, pan, etc.)
  const originalScale = stage.scale();
  const originalPosition = stage.position();
  const originalSize = { width: stage.width(), height: stage.height() };

  // Hide transformer before export
  const transformer = stage.findOne("Transformer");
  const transformerWasVisible = transformer?.visible();
  if (transformer) {
    transformer.visible(false);
  }

  try {
    // Reset stage to 1:1 scale and 0,0 position for export
    // This ensures we export the content exactly as defined in the template
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    // Ensure stage size matches template size (if provided)
    if (options.templateWidth && options.templateHeight) {
      stage.width(options.templateWidth);
      stage.height(options.templateHeight);
    }

    // Export based on format
    switch (options.format) {
      case "PNG":
        await exportAsPNG(stage, options);
        break;
      case "PDF":
        await exportAsPDF(stage, options);
        break;
      default:
        // @ts-ignore
        throw new Error(`Unsupported format: ${options.format}`);
    }
  } finally {
    // Restore stage state
    if (transformer && transformerWasVisible) {
      transformer.visible(true);
    }
    stage.scale(originalScale || { x: 1, y: 1 });
    stage.position(originalPosition || { x: 0, y: 0 });
    stage.width(originalSize.width);
    stage.height(originalSize.height);
    stage.batchDraw();
  }
}

// Legacy functions for backward compatibility
export function downloadPNG(stage: Konva.Stage, filename: string = "card.png") {
  const dataURL = stage.toDataURL({ pixelRatio: 3 });
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  link.click();
}

export function downloadPDF(stage: Konva.Stage, filename: string = "card.pdf") {
  const dataURL = stage.toDataURL({ pixelRatio: 3 });
  const pdf = new jsPDF({
    orientation: stage.width() > stage.height() ? "landscape" : "portrait",
    unit: "px",
    format: [stage.width(), stage.height()],
  });
  pdf.addImage(dataURL, "PNG", 0, 0, stage.width(), stage.height());
  pdf.save(filename);
}
