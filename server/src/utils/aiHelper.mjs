import fs from 'fs';
import path from 'path';
import { getCVText } from './pdfParser.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

console.log(
  '🔑 GEMINI_API_KEY:',
  process.env.GEMINI_API_KEY ? `Đã cấu hình (${process.env.GEMINI_API_KEY.slice(0, 15)}...)` : '❌ Chưa cấu hình'
);

// ⚙️ Khởi tạo Gemini client
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

/**
 * Phân tích CV và Job → chấm điểm độ phù hợp (0–100)
 * @param {object} opts
 * @param {string} opts.cvUrl - Đường dẫn file CV
 * @param {string} opts.jobTitle - Tiêu đề công việc
 * @param {string} opts.jobRequirements - Mô tả yêu cầu công việc
 * @param {string[]} [opts.jobSkills] - Danh sách kỹ năng
 * @returns {Promise<{score:number, analysis:{strengths:string[], weaknesses:string[]}}>}
 */
export async function callAiMatchCV({ cvUrl, jobTitle, jobRequirements, jobSkills = [] }) {
  try {
    // ✅ Check Gemini client
    if (!genAI) {
      console.error('❌ GEMINI_API_KEY chưa được cấu hình!');
      return {
        score: 0,
        analysis: {
          strengths: [],
          weaknesses: ['Chưa cấu hình GEMINI_API_KEY trong .env'],
        },
      };
    }

    // 1️⃣ Đọc nội dung CV và extract text
    const cvResult = await getCVText(cvUrl);

    // Extract text từ TextResult object
    const cvText = typeof cvResult === 'string' ? cvResult : cvResult?.text || '';

    console.log('ℹ️ Đã trích xuất CV text:', cvText);

    if (!cvText || cvText.length < 100) {
      console.warn('⚠️ CV text quá ngắn hoặc trống:', cvUrl);
      return {
        score: 0,
        analysis: {
          strengths: [],
          weaknesses: ['CV không thể đọc được hoặc nội dung quá ngắn'],
        },
      };
    }

    // 2️⃣ Làm sạch CV text (loại bỏ ký tự thừa)
    const cleanedCV = cvText
      .replace(/--\s*\d+\s*of\s*\d+\s*--/g, '') // Xóa "-- 1 of 2 --"
      .replace(/©\s*topcv\.vn/g, '') // Xóa watermark
      .replace(/\n{3,}/g, '\n\n') // Giảm xuống dòng thừa
      .trim();

    // 3️⃣ Tạo prompt cho Gemini
    const prompt = `
Bạn là chuyên gia tuyển dụng chuyên nghiệp.
Đọc kỹ mô tả công việc và CV dưới đây, sau đó đánh giá độ phù hợp từ 0-100 điểm.

QUAN TRỌNG: Trả về JSON đúng format sau (không thêm bất kỳ text nào khác):
{
  "score": 75,
  "analysis": {
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"]
  }
}

=== CÔNG VIỆC ===
Chức danh: ${jobTitle}
Kỹ năng yêu cầu: ${jobSkills.join(', ') || 'Không rõ'}
Mô tả:
${jobRequirements}

=== CV ỨNG VIÊN ===
${cvText}

Hãy chấm điểm dựa trên:
- Kinh nghiệm liên quan (30%)
- Kỹ năng phù hợp (30%)
- Trình độ học vấn (10%)
- Dự án thực tế (30%)
`;

    // 3️⃣ Gọi Gemini API
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout sau 30s')), 30000)),
    ]);

    const rawText = result.response.text().trim();
    console.log('📥 Gemini raw output:', rawText.slice(0, 200) + '...');

    // 4️⃣ Parse JSON an toàn
    let parsed;
    try {
      // Xử lý trường hợp Gemini wrap JSON trong markdown
      let cleanJson = rawText;
      if (rawText.includes('```json')) {
        cleanJson = rawText.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || rawText;
      } else if (rawText.includes('```')) {
        cleanJson = rawText.match(/```\s*([\s\S]*?)\s*```/)?.[1] || rawText;
      }

      parsed = JSON.parse(cleanJson);

      // Validate và normalize
      if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
        console.warn('⚠️ Score không hợp lệ:', parsed.score);
        parsed.score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
      }

      if (!parsed.analysis || typeof parsed.analysis !== 'object') {
        parsed.analysis = { strengths: [], weaknesses: [] };
      }

      if (!Array.isArray(parsed.analysis.strengths)) {
        parsed.analysis.strengths = [];
      }

      if (!Array.isArray(parsed.analysis.weaknesses)) {
        parsed.analysis.weaknesses = [];
      }
    } catch (parseErr) {
      console.warn('⚠️ JSON parse lỗi:', parseErr.message);
      console.warn('Raw text:', rawText);

      parsed = {
        score: 0,
        analysis: {
          strengths: [],
          weaknesses: ['Không thể phân tích CV - Gemini trả về dữ liệu không hợp lệ'],
        },
      };
    }

    console.log('✅ Gemini AI Match CV - Score:', parsed.score);
    return parsed;
  } catch (err) {
    console.error('❌ Lỗi callAiMatchCV (Gemini):', err.message);

    // Chi tiết lỗi để debug
    if (err.status === 404) {
      console.error('💡 Model không tồn tại. Đang dùng: gemini-1.5-flash-latest');
    } else if (err.status === 401 || err.status === 403) {
      console.error('💡 API key không hợp lệ hoặc hết hạn');
    }

    return {
      score: 0,
      analysis: {
        strengths: [],
        weaknesses: ['Lỗi hệ thống khi phân tích CV: ' + err.message],
      },
    };
  }
}
