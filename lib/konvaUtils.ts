// lib/konvaUtils.ts
import Konva from "konva";
// import { Stage } from "react-konva";

/**
 * Serialize a Konva Stage to JSON
 */
export function serializeStage(stage: Konva.Stage): string {
  return stage.toJSON();
}

/**
 * Deserialize JSON to Konva.Stage (for saving/loading)
 */
export function deserializeStage(json: string, containerId: string): Konva.Stage {
  const stage = Konva.Node.create(json, containerId) as Konva.Stage;
  return stage;
}

/**
 * Export stage to PNG data URL
 */
export function exportStageToPNG(stage: Konva.Stage, pixelRatio = 3): string {
  return stage.toDataURL({ pixelRatio });
}
