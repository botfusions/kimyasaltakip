import sys
import os
import subprocess
from pdf2image import convert_from_path
from PIL import Image
import tempfile

# Tesseract path (Windows)
TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def run_tesseract(input_file, lang='tur+eng', tessdata_path=None):
    cmd = [TESSERACT_CMD, input_file, 'stdout', '-l', lang]
    if tessdata_path:
        cmd.extend(['--tessdata-dir', tessdata_path])
    
    # Run command and capture output
    # Tesseract writes result to stdout
    result = subprocess.run(cmd, capture_output=True)
    
    if result.returncode != 0:
        error_msg = result.stderr.decode('utf-8', errors='ignore')
        # Tesseract sometimes warns to stderr but still works. 
        # But if returnCode != 0 it failed.
        raise Exception(f"Tesseract failed: {error_msg}")
    
    # Try decoding
    try:
        return result.stdout.decode('utf-8')
    except UnicodeDecodeError:
        try:
            return result.stdout.decode('cp1254') # Turkish
        except:
            return result.stdout.decode('latin-1', errors='ignore')

def ocr_file(file_path):
    try:
        if not os.path.exists(file_path):
            print(f"Error: File not found: {file_path}")
            sys.exit(1)

        file_ext = os.path.splitext(file_path)[1].lower()
        full_text = ""

        # Local tessdata path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        tessdata_dir = os.path.join(script_dir, 'tessdata')

        if file_ext == '.pdf':
            # PDF to Image to Text
            try:
                images = convert_from_path(file_path, 300)
                for i, image in enumerate(images):
                    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                        image.save(tmp.name)
                        tmp_path = tmp.name
                    
                    try:
                        text = run_tesseract(tmp_path, lang='tur+eng', tessdata_path=tessdata_dir)
                        full_text += text + "\n"
                    finally:
                        if os.path.exists(tmp_path):
                            os.remove(tmp_path)
            except Exception as e:
                print(f"Error converting PDF: {e}")
                sys.exit(1)
        
        elif file_ext in ['.jpg', '.jpeg', '.png']:
            # Image to Text
            try:
                full_text = run_tesseract(file_path, lang='tur+eng', tessdata_path=tessdata_dir)
            except Exception as e:
                print(f"Error reading image: {e}")
                sys.exit(1)
        
        else:
            print(f"Unsupported file type: {file_ext}")
            sys.exit(1)

        # Output to stdout
        sys.stdout.reconfigure(encoding='utf-8')
        print(full_text)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ocr_invoice.py <file_path>")
        sys.exit(1)
    
    ocr_file(sys.argv[1])
