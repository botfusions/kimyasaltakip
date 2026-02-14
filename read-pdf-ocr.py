from pdf2image import convert_from_path
import pytesseract
import sys
import os

# Tesseract path (Windows için)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def pdf_to_text_with_ocr(pdf_path):
    try:
        print("📄 PDF'den görüntü oluşturuluyor...")
        # PDF'i görüntüye çevir
        images = convert_from_path(pdf_path, 300)  # 300 DPI
        
        print(f"✅ {len(images)} sayfa görüntüye çevrildi\n")
        print("="*80)
        
        full_text = ""
        
        for i, image in enumerate(images):
            print(f"\n--- Sayfa {i+1} OCR işleniyor... ---\n")
            
            # OCR ile metni çıkar
            text = pytesseract.image_to_string(image, lang='tur+eng')
            full_text += f"\n--- Sayfa {i+1} ---\n{text}\n"
            
            print(text)
        
        # Dosyaya kaydet
        with open('recete-form-text.txt', 'w', encoding='utf-8') as f:
            f.write(full_text)
        
        print("\n" + "="*80)
        print("✅ OCR tamamlandı ve 'recete-form-text.txt' dosyasına kaydedildi.")
        
    except FileNotFoundError as e:
        print("❌ Tesseract OCR bulunamadı.")
        print("Lütfen Tesseract OCR'yi kurun: https://github.com/UB-Mannheim/tesseract/wiki")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        pdf_path = r"C:\Users\user\Downloads\Z.ai_claude code\KİMYASAL TAKİP\reçete.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"❌ Dosya bulunamadı: {pdf_path}")
        sys.exit(1)
    
    pdf_to_text_with_ocr(pdf_path)
