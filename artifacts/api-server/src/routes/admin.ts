import { Router } from "express";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { adminUsersTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function getSmtpConfig() {
  const all = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const row of all) map[row.key] = row.value;
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || map["smtpGmail"] || "",
    pass: process.env.SMTP_PASS || map["smtpPassword"] || "",
    from: process.env.SMTP_FROM || map["smtpGmail"] || "",
    siteName: map["siteName"] || "Musholla Nurul Iman",
  };
}

const router = Router();

async function getAdminUser() {
  const [user] = await db.select().from(adminUsersTable).limit(1);
  return user;
}

async function ensureDefaultAdmin() {
  const existing = await getAdminUser();
  if (!existing) {
    const hash = await bcrypt.hash("istiqlal2024", 10);
    await db.insert(adminUsersTable).values({
      username: "admin",
      passwordHash: hash,
      email: "admin@istiqlal.or.id",
    });
  }
  return getAdminUser();
}

router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await ensureDefaultAdmin();
    if (!admin || admin.username !== username) {
      return res.status(401).json({ success: false, token: null, message: "Username atau password salah" });
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, token: null, message: "Username atau password salah" });
    }
    res.json({ success: true, token: "admin-token-istiqlal-2024", message: "Login berhasil" });
  } catch (err) {
    req.log.error({ err }, "Failed to login");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/change-password", async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Password lama dan baru diperlukan" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password baru minimal 6 karakter" });
    }
    const admin = await getAdminUser();
    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }
    const valid = await bcrypt.compare(oldPassword, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Password lama salah" });
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(adminUsersTable)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(adminUsersTable.id, admin.id));
    res.json({ success: true, message: "Password berhasil diubah" });
  } catch (err) {
    req.log.error({ err }, "Failed to change password");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/profile", async (req, res) => {
  try {
    const admin = await getAdminUser();
    if (!admin) return res.status(404).json({ message: "Admin tidak ditemukan" });
    res.json({ username: admin.username, email: admin.email });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/profile", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email diperlukan" });
    const admin = await getAdminUser();
    if (!admin) return res.status(404).json({ message: "Admin tidak ditemukan" });
    await db.update(adminUsersTable)
      .set({ email, updatedAt: new Date() })
      .where(eq(adminUsersTable.id, admin.id));
    res.json({ success: true, message: "Email berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email diperlukan" });

    const admin = await getAdminUser();
    if (!admin || admin.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(404).json({ message: "Email tidak terdaftar di sistem" });
    }

    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
    let newPassword = "";
    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(adminUsersTable)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(adminUsersTable.id, admin.id));

    let emailSent = false;
    const smtp = await getSmtpConfig();

    if (smtp.user && smtp.pass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          auth: { user: smtp.user, pass: smtp.pass },
        });
        await transporter.sendMail({
          from: `"${smtp.siteName}" <${smtp.from}>`,
          to: admin.email,
          subject: `Reset Password - Portal Admin ${smtp.siteName}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
              <h2 style="color:#15803d;margin-bottom:8px;">Reset Password Admin</h2>
              <p style="color:#374151;">Password baru Anda telah dibuat secara otomatis:</p>
              <div style="background:#fff;border:2px solid #15803d;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
                <strong style="font-size:22px;letter-spacing:2px;color:#15803d;">${newPassword}</strong>
              </div>
              <p style="color:#6b7280;font-size:14px;">Segera login dan ubah password Anda melalui menu <b>Ubah Password</b> di portal admin.</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (mailErr) {
        req.log.error({ mailErr }, "Failed to send email");
      }
    }

    if (emailSent) {
      res.json({ success: true, message: `Password baru telah dikirim ke ${admin.email}`, emailSent: true });
    } else {
      res.json({ success: true, message: "Password baru berhasil dibuat", emailSent: false, tempPassword: newPassword });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to reset password");
    res.status(500).json({ error: "Internal server error" });
  }
});

async function setSetting(key: string, value: string) {
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value }).where(eq(settingsTable.key, key));
  } else {
    await db.insert(settingsTable).values({ key, value });
  }
}

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
  return row?.value ?? null;
}

router.put("/admin/cctv-access", async (req, res) => {
  try {
    const { cctvPageTitle, cctvPageDescription, cctvAccessPassword } = req.body;
    if (cctvPageTitle !== undefined) await setSetting("cctvPageTitle", cctvPageTitle);
    if (cctvPageDescription !== undefined) await setSetting("cctvPageDescription", cctvPageDescription);
    if (cctvAccessPassword !== undefined) {
      if (cctvAccessPassword === "") {
        await setSetting("cctvAccessPasswordHash", "");
      } else {
        const hash = await bcrypt.hash(cctvAccessPassword, 10);
        await setSetting("cctvAccessPasswordHash", hash);
      }
    }
    res.json({ success: true, message: "Pengaturan CCTV berhasil disimpan" });
  } catch (err) {
    req.log.error({ err }, "Failed to save CCTV access settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/cctv-access", async (req, res) => {
  try {
    const title = await getSetting("cctvPageTitle");
    const description = await getSetting("cctvPageDescription");
    const hash = await getSetting("cctvAccessPasswordHash");
    res.json({
      cctvPageTitle: title ?? "Live CCTV",
      cctvPageDescription: description ?? "Pantauan langsung area musholla",
      hasPassword: !!hash,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
