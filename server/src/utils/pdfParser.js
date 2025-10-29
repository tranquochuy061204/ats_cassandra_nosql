import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

export async function getCVText(cvUrl) {
  try {
    const filePath = path.join(process.cwd(), `../../NoSQL/server/${cvUrl.replace(/^\/+/, '')}`);
    console.log('ℹ️ Đang đọc file CV tại:', filePath);

    const parser = new PDFParse({ url: filePath });

    // Check nếu output có text hoặc không
    const result = await parser.getText();

    return result.text;
  } catch (err) {
    console.error('❌ Lỗi khi đọc CV PDF:', err);
  }
}
