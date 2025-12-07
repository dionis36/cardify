import { KonvaNodeDefinition } from "@/types/template";

export interface NodeCapabilities {
    isSelectable: boolean;
    hasCrop: boolean;
    hasFill: boolean;
    hasStroke: boolean;
    canEditPoints: boolean;
    canEditText: boolean;
    canEnterIsolationMode: boolean;
    hasFilters: boolean;
    canEditQRCode: boolean;
    canEditLogo: boolean;
}

export const DEFAULT_CAPABILITIES: NodeCapabilities = {
    isSelectable: true,
    hasCrop: false,
    hasFill: true,
    hasStroke: true,
    canEditPoints: false,
    canEditText: false,
    canEnterIsolationMode: false,
    hasFilters: false,
    canEditQRCode: false,
    canEditLogo: false,
};

export function getNodeCapabilities(node: KonvaNodeDefinition): NodeCapabilities {
    const type = node.type;

    switch (type) {
        case "Text":
            return {
                ...DEFAULT_CAPABILITIES,
                hasFill: true, // Text color
                hasStroke: false, // Usually text doesn't have stroke in this app context, but Konva supports it. Let's say false for now unless we add outline text.
                canEditText: true,
            };

        case "Image":
            // Check if this is a QR code or logo
            const isQRCode = !!(node.props as any).qrMetadata;
            const isLogo = !!(node.props as any).isLogo;

            return {
                ...DEFAULT_CAPABILITIES,
                hasFill: false,
                hasStroke: true, // Border
                hasCrop: !isQRCode && !isLogo, // QR codes and logos shouldn't be cropped
                hasFilters: true,
                canEditQRCode: isQRCode,
                canEditLogo: isLogo,
            };

        case "Rect":
        case "Circle":
        case "Ellipse":
        case "Star":
        case "RegularPolygon":
            return {
                ...DEFAULT_CAPABILITIES,
                hasFill: true,
                hasStroke: true,
                // canEditPoints: true, // Future: if we allow converting to path
            };

        case "Path":
        case "Icon": // Icons are essentially paths
            return {
                ...DEFAULT_CAPABILITIES,
                hasFill: true,
                hasStroke: true,
                // canEditPoints: true, // Future
            };

        case "Line":
        case "Arrow":
            return {
                ...DEFAULT_CAPABILITIES,
                hasFill: false, // Lines are stroke only
                hasStroke: true,
                canEditPoints: false, // Future: bezier editing
            };

        // case "Group": // If we had a Group type in KonvaNodeDefinition
        //   return {
        //     ...DEFAULT_CAPABILITIES,
        //     hasFill: false,
        //     hasStroke: false,
        //     canEnterIsolationMode: true,
        //   };

        default:
            return DEFAULT_CAPABILITIES;
    }
}
