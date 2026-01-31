import fitz  # PyMuPDF
import sys

def read_pdf_with_pymupdf(pdf_path):
    try:
        print("📄 PDF açılıyor...")
        doc = fitz.open(pdf_path)
        
        print(f"   Sayfa sayısı: {len(doc)}")
        print(f"\n{'='*80}\n")
        
        full_text = ""
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            print(f"--- Sayfa {page_num + 1} ---")
            print(text)
            print()
            
            full_text += f"\n--- Sayfa {page_num + 1} ---\n{text}\n"
        
        # Dosyaya kaydet
        with open('recete-form-text.txt', 'w', encoding='utf-8') as f:
            f.write(full_text)
        
        print("="*80)
        print("✅ PDF içeriği 'recete-form-text.txt' dosyasına kaydedildi.")
        
        # Ayrıca PDF'den görüntü de çıkaralım
        print("\n📸 PDF'den görüntü çıkarılıyor...")
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
            output_file = f"recete-page-{i+1}.png"
            pix.save(output_file)
            print(f"   ✅ Sayfa {i+1} -> {output_file}")
        
        doc.close()
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    pdf_path = r"C:\Users\user\Downloads\Z.ai_claude code\KİMYASAL TAKİP\reçete.pdf"
    read_pdf_with_pymupdf(pdf_path)
