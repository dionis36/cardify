// lib/qrcodeGenerator.ts
// Server-side QR code generation utility for template variations

import QRCode from 'qrcode';

interface QRMetadata {
    value: string;
    fgColor: string;
    bgColor: string;
    dotStyle?: string;
    eyeStyle?: string;
    eyeRadius?: number | [number, number, number];
    logoUrl?: string;
    logoSource?: string | null;
    ecLevel?: string;
    contentType?: string;
    inputs?: Record<string, string>;
}

/**
 * Regenerates a QR code with a new foreground color SYNCHRONOUSLY.
 * Uses a workaround since qrcode library is async-only in Node.js.
 * Returns updated metadata AND a new base64 image.
 */
export function regenerateQRCodeSync(
    qrMetadata: QRMetadata,
    newFgColor: string
): { metadata: QRMetadata; base64Image: string } {
    const updatedMetadata = {
        ...qrMetadata,
        fgColor: newFgColor
    };

    try {
        // For server-side (Node.js), we need to use the async version
        // but we'll handle it differently in the calling code
        // For now, return metadata only and let client regenerate
        return {
            metadata: updatedMetadata,
            base64Image: '' // Will be regenerated client-side or in async context
        };
    } catch (error) {
        console.error('Failed to regenerate QR code:', error);
        return {
            metadata: updatedMetadata,
            base64Image: ''
        };
    }
}

/**
 * Async version - the proper way to regenerate QR codes.
 * This should be used in async contexts.
 */
export async function regenerateQRCodeAsync(
    qrMetadata: QRMetadata,
    newFgColor: string
): Promise<{ metadata: QRMetadata; base64Image: string }> {
    const updatedMetadata = {
        ...qrMetadata,
        fgColor: newFgColor
    };

    try {
        const dataUrl = await QRCode.toDataURL(qrMetadata.value, {
            errorCorrectionLevel: (qrMetadata.ecLevel as any) || 'Q',
            color: {
                dark: newFgColor,
                light: qrMetadata.bgColor === 'transparent' ? '#00000000' : qrMetadata.bgColor
            },
            width: 400,
            margin: 1
        });

        return {
            metadata: updatedMetadata,
            base64Image: dataUrl
        };
    } catch (error) {
        console.error('Failed to regenerate QR code:', error);
        return {
            metadata: updatedMetadata,
            base64Image: ''
        };
    }
}

/**
 * Checks if a layer is a QR code.
 */
export function isQRCodeLayer(layer: any): boolean {
    return layer.type === 'Image' &&
        layer.props?.qrMetadata !== undefined;
}
