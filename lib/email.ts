import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@learn-e-plus.com";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${BASE_URL}/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "ยืนยันอีเมลของคุณ — Learn E+",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e40af">Learn E+</h2>
        <p>กดปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#1e40af;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
          ยืนยันอีเมล
        </a>
        <p style="color:#6b7280;font-size:14px">ลิงก์หมดอายุใน 24 ชั่วโมง หากไม่ได้สมัคร กรุณาเพิกเฉย</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${BASE_URL}/auth/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "รีเซ็ตรหัสผ่าน — Learn E+",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e40af">Learn E+</h2>
        <p>กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#1e40af;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
          รีเซ็ตรหัสผ่าน
        </a>
        <p style="color:#6b7280;font-size:14px">ลิงก์หมดอายุใน 1 ชั่วโมง หากไม่ได้ขอรีเซ็ต กรุณาเพิกเฉย</p>
      </div>
    `,
  });
}

export async function sendWeeklyReportEmail(
  email: string,
  displayName: string,
  data: { studyDays: number; lessonsCompleted: number; testAvgScore: number | null }
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "รายงานผลการเรียนประจำสัปดาห์ — Learn E+",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e40af">สวัสดี ${displayName}!</h2>
        <p>สรุปผลการเรียนสัปดาห์ที่ผ่านมา</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;border:1px solid #e5e7eb">วันที่เรียน</td><td style="padding:8px;border:1px solid #e5e7eb">${data.studyDays} วัน</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb">บทเรียนที่เรียนจบ</td><td style="padding:8px;border:1px solid #e5e7eb">${data.lessonsCompleted} บท</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb">คะแนนเฉลี่ย</td><td style="padding:8px;border:1px solid #e5e7eb">${data.testAvgScore ?? "-"}</td></tr>
        </table>
        <a href="${BASE_URL}/reports/weekly" style="display:inline-block;padding:12px 24px;background:#1e40af;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
          ดูรายงานเต็ม
        </a>
      </div>
    `,
  });
}
