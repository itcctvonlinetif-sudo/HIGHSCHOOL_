import { Router } from "express";
import nodemailer from "nodemailer";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function getEmailConfig() {
  const keys = ["smtpGmail", "smtpPassword", "smtpRecipient", "siteName"];
  const all = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const row of all) {
    if (keys.includes(row.key)) map[row.key] = row.value;
  }
  return {
    email: map["smtpGmail"] || process.env.SMTP_USER || "",
    password: map["smtpPassword"] || process.env.SMTP_PASS || "",
    recipient: map["smtpRecipient"] || process.env.SMTP_RECIPIENT || map["smtpGmail"] || process.env.SMTP_USER || "",
    siteName: map["siteName"] || "Musholla Nurul Iman",
  };
}

function createTransporter(email: string, password: string) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: email, pass: password },
  });
}

router.get("/email-config", async (req, res) => {
  try {
    const config = await getEmailConfig();
    res.json({
      smtpGmail: config.email,
      smtpPassword: config.password ? "••••••••" : "",
      smtpRecipient: config.recipient,
      configured: !!(config.email && config.password),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get email config");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/email-config", async (req, res) => {
  try {
    const { smtpGmail, smtpPassword, smtpRecipient } = req.body;
    const updates: { key: string; value: string }[] = [];

    if (smtpGmail !== undefined) updates.push({ key: "smtpGmail", value: smtpGmail });
    if (smtpPassword !== undefined && smtpPassword !== "••••••••") {
      updates.push({ key: "smtpPassword", value: smtpPassword });
    }
    if (smtpRecipient !== undefined) updates.push({ key: "smtpRecipient", value: smtpRecipient });

    for (const { key, value } of updates) {
      await db.insert(settingsTable)
        .values({ key, value })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
    }

    res.json({ success: true, message: "Konfigurasi email berhasil disimpan" });
  } catch (err) {
    req.log.error({ err }, "Failed to save email config");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/email-config/test", async (req, res) => {
  try {
    const config = await getEmailConfig();
    if (!config.email || !config.password) {
      return res.status(400).json({ success: false, message: "Gmail dan App Password belum dikonfigurasi" });
    }

    const transporter = createTransporter(config.email, config.password);
    await transporter.sendMail({
      from: `"${config.siteName}" <${config.email}>`,
      to: config.recipient || config.email,
      subject: `Test Email – Portal Admin ${config.siteName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="background:#15803d;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
            <h2 style="color:#fff;margin:0;">✅ Email Berhasil!</h2>
          </div>
          <p style="color:#374151;">Konfigurasi email Gmail di portal admin ${config.siteName} telah berhasil disiapkan.</p>
          <p style="color:#374151;">Email ini dikirim sebagai konfirmasi bahwa sistem pengiriman email berjalan dengan baik.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
          <p style="color:#9ca3af;font-size:12px;">Portal Admin ${config.siteName}</p>
        </div>
      `,
    });

    res.json({ success: true, message: `Email test berhasil dikirim ke ${config.recipient || config.email}` });
  } catch (err: any) {
    req.log.error({ err }, "Failed to send test email");
    res.status(400).json({ 
      success: false, 
      message: `Gagal mengirim email: ${err?.message || "Periksa Gmail dan App Password Anda"}` 
    });
  }
});

router.post("/contact", async (req, res) => {
  try {
    const { name, email, whatsapp, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
    }

    const config = await getEmailConfig();
    if (!config.email || !config.password) {
      return res.status(503).json({ 
        success: false, 
        message: "Layanan email belum dikonfigurasi. Silakan hubungi kami langsung melalui telepon." 
      });
    }

    const transporter = createTransporter(config.email, config.password);
    await transporter.sendMail({
      from: `"${config.siteName}" <${config.email}>`,
      to: config.recipient,
      replyTo: email,
      subject: `[Pesan Kontak] ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="background:#15803d;padding:20px 24px;border-radius:8px;margin-bottom:24px;">
            <h2 style="color:#fff;margin:0;font-size:20px;">📧 Pesan Baru dari Website</h2>
            <p style="color:#bbf7d0;margin:4px 0 0;font-size:14px;">${config.siteName} – Formulir Kontak</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#374151;width:120px;">Nama</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#374151;">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#374151;">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#374151;"><a href="mailto:${email}" style="color:#15803d;">${email}</a></td>
            </tr>
            ${whatsapp ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#374151;">WhatsApp</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#374151;"><a href="https://wa.me/${whatsapp.replace(/[^0-9]/g, "").replace(/^0/, "62")}" style="color:#15803d;">${whatsapp}</a></td>
            </tr>` : ""}
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#374151;">Subjek</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#374151;">${subject}</td>
            </tr>
          </table>
          <div style="margin-top:20px;">
            <p style="font-weight:bold;color:#374151;margin-bottom:8px;">Pesan:</p>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message}</div>
          </div>
          <div style="margin-top:20px;padding:12px 16px;background:#fefce8;border:1px solid #fef08a;border-radius:8px;">
            <p style="margin:0;font-size:13px;color:#713f12;">💡 Untuk membalas, gunakan tombol Reply ke email pengirim: <strong>${email}</strong></p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: "Pesan Anda berhasil dikirim. Kami akan merespons secepatnya." });
  } catch (err: any) {
    req.log.error({ err }, "Failed to send contact email");
    res.status(500).json({ 
      success: false, 
      message: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi atau hubungi kami langsung." 
    });
  }
});

export default router;
