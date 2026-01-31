import JsBarcode from 'jsbarcode';

/**
 * Generates a barcode as a data URL for a given value
 * @param value Barcode value (e.g., "RTKS-20260131-1234")
 * @param format Barcode format (default: "CODE128")
 * @returns Data URL of the generated barcode image
 */
export function generateBarcodeDataURL(
    value: string,
    format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' = 'CODE128'
): string {
    try {
        // Create a canvas element
        const canvas = document.createElement('canvas');

        // Generate barcode on canvas
        JsBarcode(canvas, value, {
            format: format,
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            margin: 10,
            background: '#ffffff',
            lineColor: '#000000',
        });

        // Return data URL
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Barcode generation error:', error);
        return '';
    }
}

/**
 * Generates a barcode as SVG string
 * @param value Barcode value
 * @returns SVG string
 */
export function generateBarcodeSVG(value: string): string {
    try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        JsBarcode(svg, value, {
            format: 'CODE128',
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            margin: 10,
        });

        return svg.outerHTML;
    } catch (error) {
        console.error('Barcode SVG generation error:', error);
        return '';
    }
}

/**
 * Downloads a barcode as PNG image
 * @param value Barcode value
 * @param filename Download filename
 */
export function downloadBarcode(value: string, filename: string = 'barcode.png'): void {
    const dataURL = generateBarcodeDataURL(value);

    if (!dataURL) {
        console.error('Failed to generate barcode');
        return;
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Validates barcode format
 * @param barcode Barcode string to validate
 * @returns true if valid RATEKS barcode format
 */
export function validateBarcodeFormat(barcode: string): boolean {
    // Format: RTKS-YYYYMMDD-NNNN
    const pattern = /^RTKS-\d{8}-\d{4}$/;
    return pattern.test(barcode);
}

/**
 * Parses RATEKS barcode into components
 * @param barcode Barcode string
 * @returns Object with date and sequence number, or null if invalid
 */
export function parseBarcodeComponents(barcode: string): {
    date: string;
    sequence: string;
} | null {
    if (!validateBarcodeFormat(barcode)) {
        return null;
    }

    const parts = barcode.split('-');
    return {
        date: parts[1], // YYYYMMDD
        sequence: parts[2], // NNNN
    };
}
