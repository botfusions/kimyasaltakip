import PyPDF2
import sys

def read_pdf(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            print(f"📄 PDF Bilgisi:")
            print(f"   Sayfa sayısı: {len(pdf_reader.pages)}")
            print(f"\n{'='*80}\n")
            
            for i, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text += f"\n--- Sayfa {i+1} ---\n"
                text += page_text
                
            print(text)
            
            # Dosyaya da kaydet
            with open('recete-form-text.txt', 'w', encoding='utf-8') as output:
                output.write(text)
                
            print(f"\n{'='*80}")
            print(f"✅ PDF içeriği 'recete-form-text.txt' dosyasına kaydedildi.")
            
    except Exception as e:
        print(f"❌ Hata: {e}")
        sys.exit(1)

if __name__ == "__main__":
    pdf_path = r"C:\Users\user\Downloads\Z.ai_claude code\KİMYASAL TAKİP\fatura\7350213672_RUD2025000023792.pdf"
    read_pdf(pdf_path)
