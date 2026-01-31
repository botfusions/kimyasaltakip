import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { generateBarcodeDataURL } from '@/lib/barcode';

interface RecipeItem {
    material: {
        code: string;
        name: string;
        unit: string;
    };
    quantity: number;
    percentage: number;
    notes: string | null;
}

interface Recipe {
    version_code: string;
    barcode?: string | null;
    order_code?: string | null;
    product: {
        code: string;
        name: string;
        unit: string;
    } | null;
    created_by_user: {
        name: string;
    };
    approved_by_user: {
        name: string;
        signature_id: string;
    } | null;
    approved_at: string | null;
    notes: string | null;
    recipe_items: RecipeItem[];
}

// Extend jsPDF with autotable
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
}

export const generateRecipePDF = (recipe: Recipe) => {
    // Create PDF in A4 size
    const doc = new jsPDF() as jsPDFWithAutoTable;

    // Helper for Turkish characters (basic replacement if needed, 
    // but standard fonts in jsPDF usually support latin-ext if handled correctly)
    const t = (text: string) => text;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(t('URUN RECETESI'), 14, 22);

    // Barcode
    const barcodeValue = recipe.barcode || recipe.order_code || recipe.version_code;
    if (barcodeValue) {
        const barcodeDataURL = generateBarcodeDataURL(barcodeValue);
        if (barcodeDataURL) {
            doc.addImage(barcodeDataURL, 'PNG', 150, 10, 45, 15);
        }
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(t(`Versiyon: ${recipe.version_code}`), 14, 28);
    doc.text(t(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 14, 33);

    // --- Product Info Box ---
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 40, 196, 40);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(t('Urun Bilgileri:'), 14, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(t(`Urun Adi: ${recipe.product?.name || '-'}`), 20, 55);
    doc.text(t(`Urun Kodu: ${recipe.product?.code || '-'}`), 20, 60);
    doc.text(t(`Olcu Birimi: ${recipe.product?.unit || 'kg'}`), 20, 65);

    // --- Materials Table ---
    const tableData = recipe.recipe_items.map(item => [
        item.material.name,
        item.material.code,
        `${item.quantity} ${item.material.unit}`,
        `${item.percentage}%`,
        item.notes || '-'
    ]);

    const totalQuantity = recipe.recipe_items.reduce((sum, item) => sum + item.quantity, 0);

    doc.autoTable({
        startY: 75,
        head: [[t('Malzeme'), t('Kod'), t('Miktar'), t('Oran (%)'), t('Notlar')]],
        body: tableData,
        foot: [[t('TOPLAM'), '', `${totalQuantity.toFixed(2)} ${recipe.product?.unit || 'kg'}`, '100.00%', '']],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
    });

    // --- Notes Section ---
    const finalY = (doc as any).lastAutoTable.finalY || 150;

    if (recipe.notes) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(t('Recete Notlari:'), 14, finalY + 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(recipe.notes, 170);
        doc.text(splitNotes, 16, finalY + 22);
    }

    // --- Signature Section ---
    const signatureY = Math.max(finalY + 50, 230);

    // Line for signatures
    doc.setDrawColor(200, 200, 200);
    doc.line(14, signatureY - 10, 196, signatureY - 10);

    // Preparer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(t('Hazirlayan:'), 20, signatureY);
    doc.setFont('helvetica', 'normal');
    doc.text(recipe.created_by_user.name, 20, signatureY + 7);

    // Approver
    if (recipe.approved_by_user) {
        doc.setFont('helvetica', 'bold');
        doc.text(t('Onaylayan (Dijital Imza):'), 120, signatureY);
        doc.setFont('helvetica', 'normal');
        doc.text(recipe.approved_by_user.name, 120, signatureY + 7);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(t(`Imza ID: ${recipe.approved_by_user.signature_id}`), 120, signatureY + 12);
        doc.text(t(`Onay Tarihi: ${new Date(recipe.approved_at || '').toLocaleString('tr-TR')}`), 120, signatureY + 17);
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 0, 0);
        doc.text(t('ONAY BEKLIYOR'), 120, signatureY);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(t('Bu belge sistem tarafindan otomatik olarak olusturulmustur.'), 105, 285, { align: 'center' });
    doc.text(t('Kimyasal Takip Sistemi v1.0'), 105, 290, { align: 'center' });

    // Save PDF
    doc.save(`Recete_${recipe.version_code}.pdf`);
};
