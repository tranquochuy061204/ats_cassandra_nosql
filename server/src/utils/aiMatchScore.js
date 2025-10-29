import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY 
    
});

export async function aiMatchScore({ jobTitle, jobRequirements, jobSkills, cvText }) {
  const prompt = `
Bạn là chuyên gia nhân sự. 
Hãy đọc yêu cầu công việc sau và đánh giá độ phù hợp của ứng viên dựa trên CV.

Công việc: ${jobTitle}
Kỹ năng yêu cầu: ${jobSkills.join(', ')}
Mô tả yêu cầu: ${jobRequirements}

--- CV ỨNG VIÊN ---
${cvText.slice(0, 3000)}

Trả lời ngắn gọn dạng JSON như sau:
{
  "score": 0-100,
  "summary": "đánh giá ngắn gọn bằng tiếng Việt"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(completion.choices[0].message.content);
    return parsed;
  } catch {
    return { score: 0, summary: 'Không thể phân tích CV.' };
  }
}

