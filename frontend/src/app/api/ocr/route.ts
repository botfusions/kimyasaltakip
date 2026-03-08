import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    // Check file type
    const fileType = file.type;
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Sadece PDF, JPEG ve PNG dosyaları desteklenir" },
        { status: 400 },
      );
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempDir = path.join(process.cwd(), "..", "temp");
    const tempFilePath = path.join(tempDir, file.name);

    await writeFile(tempFilePath, buffer);

    try {
      // Determine which Python script to use
      let pythonScript = "read-pdf-ocr.py";
      if (fileType.startsWith("image/")) {
        pythonScript = "read-pdf-ocr.py"; // Can handle images too with Tesseract
      }

      const scriptPath = path.join(process.cwd(), "..", pythonScript);

      // Run OCR script
      const { stdout, stderr } = await execAsync(
        `python "${scriptPath}" "${tempFilePath}"`,
        { maxBuffer: 10 * 1024 * 1024 }, // 10MB buffer
      );

      if (stderr && !stdout) {
        console.error("Python OCR error:", stderr);
        return NextResponse.json(
          { error: "OCR işlemi başarısız oldu" },
          { status: 500 },
        );
      }

      // Clean up temp file
      await unlink(tempFilePath);

      // Return OCR result
      return NextResponse.json({
        success: true,
        text: stdout,
        fileName: file.name,
      });
    } catch (error: any) {
      // Clean up temp file on error
      try {
        await unlink(tempFilePath);
      } catch {}

      console.error("OCR execution error:", error);
      return NextResponse.json(
        { error: "OCR işlemi sırasında hata oluştu: " + error.message },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası: " + error.message },
      { status: 500 },
    );
  }
}
