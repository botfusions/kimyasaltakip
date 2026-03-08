import jsPDF from "jspdf";
import "jspdf-autotable";
import { UserOptions } from "jspdf-autotable";

// Extend jsPDF with autotable
export interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

/**
 * Centrally managed PDF provider to handle configurations, fonts, and base setup.
 */
export class PdfProvider {
  /**
   * Creates a new jsPDF instance pre-configured with default settings.
   */
  static createDocument(
    orientation: "p" | "l" = "p",
    unit: "mm" | "pt" = "mm",
    format: string = "a4",
  ): jsPDFWithAutoTable {
    const doc = new jsPDF(orientation, unit, format) as jsPDFWithAutoTable;
    return doc;
  }

  /**
   * Helper for Turkish character handling (can be expanded with custom fonts)
   */
  static t(text: string): string {
    return text;
  }

  /**
   * Common color palette
   */
  static Colors = {
    Primary: [41, 128, 185] as [number, number, number],
    Secondary: [44, 62, 80] as [number, number, number],
    Danger: [192, 57, 43] as [number, number, number],
    Text: [40, 40, 40] as [number, number, number],
    LightText: [100, 100, 100] as [number, number, number],
    Border: [200, 200, 200] as [number, number, number],
    TableBg: [240, 240, 240] as [number, number, number],
  };
}
