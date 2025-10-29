import { mailer } from '../config/mailer.mjs';

/**
 * Gửi email thông báo pass CV Screening
 * @param {string} toEmail
 * @param {string} candidateName
 * @param {string} jobTitle
 * @param {string} recruiterEmail
 */
export async function sendPassCvEmail(toEmail, candidateName, jobTitle, recruiterEmail) {
  const subject = `Công ty ABC - Kết quả vòng CV Screening cho vị trí ${jobTitle}`;
  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Xin chào <strong>${candidateName}</strong>,</p>

    <p>Chúc mừng bạn! Sau khi xem xét hồ sơ ứng tuyển của bạn cho vị trí <strong>${jobTitle}</strong>, 
    chúng tôi đánh giá cao năng lực và kinh nghiệm của bạn, chúng tôi gửi thư này để thông báo rằng bạn đã <strong style="color:#16a34a;">vượt qua vòng CV</strong>.</p>

    <p>Để chuẩn bị cho vòng phỏng vấn tiếp theo, vui lòng phản hồi email này với các <strong>khung thời gian bạn trống</strong> 
    trong tuần tới (ví dụ: "Chiều Thứ Ba 13:00 - 16:00, sáng Thứ Năm 15:00 - 18:00"), hoặc bất cứ tài liệu thể hiện thời khoá biểu trống của bạn để chúng tôi có thể sắp xếp lịch phỏng vấn phù hợp.</p>

    <p>Nếu có bất kỳ thắc mắc nào, bạn có thể liên hệ trực tiếp qua email của người phụ trách tuyển dụng công việc này: 
    <a href="mailto:${recruiterEmail}" style="color:#2563eb;">${recruiterEmail}</a></p>

    <p>Hãy chuẩn bị thật tốt và chúc bạn có một buổi phỏng vấn tốt đẹp và thành công !</p>
    <br/>
    <p>Trân trọng,<br/>
    <strong>Phòng Tuyển dụng - Công ty ABC</strong></p>

    <hr style="border:none;border-top:1px solid #eee;margin-top:20px;margin-bottom:10px"/>
    <p style="font-size:12px;color:#999;">
      Email này được gửi tự động từ hệ thống ATS. Vui lòng không trả lời nếu không cần thiết.
    </p>
  </div>
  `;

  await mailer.sendMail({
    from: `"ATS - Công ty ABC" <${recruiterEmail}>`,
    to: toEmail,
    subject,
    html,
  });
}

export async function sendInterviewNotificationEmail(
  toEmail,
  candidateName,
  roundName,
  scheduledAt,
  interviewerName,
  meetLink,
  recruiterEmail
) {
  const formattedDate = new Date(scheduledAt).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
    <p>Xin chào <strong>${candidateName}</strong>,</p>

    <p>Bạn đã được lên lịch phỏng vấn cho vòng <strong>${roundName}</strong>.</p>

    <p><strong>⏰ Thời gian:</strong> ${formattedDate}<br/>
       <strong>👤 Người phỏng vấn:</strong> ${interviewerName || 'Đang cập nhật'}<br/>
       <strong>💬 Link Meet:</strong> <a href="${meetLink}" style="color:#2563eb;">${meetLink}</a></p>

    <p>Vui lòng chuẩn bị kỹ trước buổi phỏng vấn và kiểm tra kết nối internet, camera, micro.</p>

    <p>Nếu có thay đổi lịch, vui lòng phản hồi email này.</p>

    <br/>
    <p>Trân trọng,<br/><strong>Phòng Tuyển dụng - Công ty ABC</strong></p>
  </div>
  `;

  await mailer.sendMail({
    from: `"ATS - Công ty ABC" <${recruiterEmail}>`,
    to: toEmail,
    subject: `📅 Lịch phỏng vấn - ${roundName}`,
    html,
  });
}

export async function sendOfferEmail(toEmail, candidateName, jobTitle, recruiterEmail, companyName = 'Công ty ABC') {
  const subject = `🎉 ${companyName} - Thư mời nhận việc cho vị trí ${jobTitle}`;
  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
    <h2 style="color:#16a34a">🎉 Xin chúc mừng ${candidateName}!</h2>

    <p>Chúng tôi rất vui thông báo rằng bạn đã <strong>vượt qua tất cả các vòng tuyển dụng</strong> 
    và được chọn cho vị trí <strong>${jobTitle}</strong> tại ${companyName}.</p>

    <p>Đội ngũ tuyển dụng đánh giá cao năng lực, thái độ và sự phù hợp của bạn với văn hóa công ty. 
    Chúng tôi tin rằng bạn sẽ là một phần quan trọng của đội ngũ.</p>

    <p>📍 <strong>Bước tiếp theo:</strong><br/>
    Vui lòng phản hồi email này để xác nhận rằng bạn <b>đồng ý nhận việc</b>. 
    Sau khi bạn xác nhận, phòng nhân sự sẽ liên hệ để gửi <strong>thư mời chính thức (Offer Letter)</strong> 
    cùng các thông tin về ngày bắt đầu, hợp đồng, và quyền lợi chi tiết.</p>

    <p>✉️ Nếu có bất kỳ thắc mắc nào, bạn có thể liên hệ trực tiếp qua email của bộ phận tuyển dụng: 
      <a href="mailto:${recruiterEmail}" style="color:#2563eb">${recruiterEmail}</a></p>

    <br/>
    <p>Trân trọng,<br/>
    <strong>Phòng Tuyển dụng - ${companyName}</strong></p>

    <hr style="border:none;border-top:1px solid #eee;margin-top:20px;margin-bottom:10px"/>
    <p style="font-size:12px;color:#999">
      Email này được gửi tự động từ hệ thống ATS. Vui lòng không trả lời nếu không cần thiết.
    </p>
  </div>
  `;

  await mailer.sendMail({
    from: `"ATS - ${companyName}" <${recruiterEmail}>`,
    to: toEmail,
    subject,
    html,
  });
}
