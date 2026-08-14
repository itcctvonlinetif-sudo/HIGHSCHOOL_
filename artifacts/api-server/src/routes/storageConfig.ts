import { Router, type Request, type Response } from "express";
import multer from "multer";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  getStorageProvider,
  getStorageConfig,
  getOneDriveAccessToken,
  uploadToGoogleDrive,
  uploadToGDriveScript,
  uploadToOneDrive,
  setSetting,
  deleteSetting,
} from "../services/storageProvider";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});
const objectStorageService = new ObjectStorageService();

/** GET /storage/provider — public, used by frontend to choose upload flow */
router.get("/storage/provider", async (req: Request, res: Response) => {
  try {
    const provider = await getStorageProvider();
    res.json({ provider });
  } catch {
    res.json({ provider: "gcs" });
  }
});

/** GET /storage/config — storage configuration (secrets masked) */
router.get("/storage/config", async (req: Request, res: Response) => {
  try {
    res.json(await getStorageConfig());
  } catch (err) {
    req.log.error({ err }, "Failed to get storage config");
    res.status(500).json({ error: "Internal server error" });
  }
});

/** PUT /storage/config — save storage configuration */
router.put("/storage/config", async (req: Request, res: Response) => {
  try {
    const { provider, gdrive, gdriveScript, onedrive } = req.body;

    if (provider) await setSetting("storage_provider", provider);

    if (gdrive) {
      if (gdrive.credentials) await setSetting("storage_gdrive_credentials", gdrive.credentials);
      if (gdrive.folderId !== undefined) await setSetting("storage_gdrive_folder_id", gdrive.folderId || "");
    }

    if (gdriveScript) {
      if (gdriveScript.scriptUrl !== undefined) await setSetting("storage_gdrive_script_url", gdriveScript.scriptUrl || "");
      if (gdriveScript.folderId !== undefined) await setSetting("storage_gdrive_folder_id", gdriveScript.folderId || "");
    }

    if (onedrive) {
      if (onedrive.clientId !== undefined) await setSetting("storage_onedrive_client_id", onedrive.clientId);
      if (onedrive.clientSecret) await setSetting("storage_onedrive_client_secret", onedrive.clientSecret);
      if (onedrive.tenantId !== undefined)
        await setSetting("storage_onedrive_tenant_id", onedrive.tenantId || "consumers");
      if (onedrive.folderPath !== undefined)
        await setSetting("storage_onedrive_folder_path", onedrive.folderPath || "mosque-uploads");
    }

    res.json(await getStorageConfig());
  } catch (err) {
    req.log.error({ err }, "Failed to save storage config");
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /storage/test-connection — test current or specified provider */
router.post("/storage/test-connection", async (req: Request, res: Response) => {
  try {
    const providerToTest: string = req.body.provider ?? (await getStorageProvider());

    if (providerToTest === "gdrive_script") {
      try {
        const [urlRow] = await db
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.key, "storage_gdrive_script_url"));

        if (!urlRow?.value) {
          res.json({ success: false, message: "Apps Script URL belum diisi" });
          return;
        }

        // Ping the script with a test payload (empty file → it will fail gracefully)
        const pingRes = await fetch(urlRow.value, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ping: true }),
          redirect: "follow",
        });
        const text = await pingRes.text();
        // If we get any JSON-parseable response, the script is reachable
        JSON.parse(text);
        res.json({ success: true, message: "Apps Script terhubung ✓ — Siap menerima upload" });
      } catch (err: any) {
        res.json({ success: false, message: `Gagal terhubung ke Apps Script: ${err.message}` });
      }
    } else if (providerToTest === "gdrive") {
      try {
        const { google } = await import("googleapis");
        const [credRow] = await db
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.key, "storage_gdrive_credentials"));

        if (!credRow?.value) {
          res.json({ success: false, message: "Service Account JSON belum dikonfigurasi" });
          return;
        }

        const credentials = JSON.parse(credRow.value);
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/drive.file"],
        });
        await auth.getAccessToken();

        const [folderRow] = await db
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.key, "storage_gdrive_folder_id"));

        if (folderRow?.value) {
          const drive = google.drive({ version: "v3", auth });
          const folder = await drive.files.get({ fileId: folderRow.value, fields: "name" });
          res.json({ success: true, message: `Terhubung ke Google Drive ✓ — Folder: "${folder.data.name}"` });
        } else {
          res.json({ success: true, message: "Terhubung ke Google Drive ✓ (menggunakan root My Drive)" });
        }
      } catch (err: any) {
        res.json({ success: false, message: `Gagal: ${err.message}` });
      }
    } else if (providerToTest === "onedrive") {
      try {
        const token = await getOneDriveAccessToken();
        const driveRes = await fetch("https://graph.microsoft.com/v1.0/me/drive", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const driveData = await driveRes.json();
        const name = driveData.owner?.user?.displayName ?? driveData.driveType ?? "OneDrive";
        res.json({ success: true, message: `Terhubung ke OneDrive ✓ — Akun: ${name}` });
      } catch (err: any) {
        res.json({ success: false, message: err.message });
      }
    } else {
      res.json({ success: true, message: "Replit GCS aktif dan berjalan ✓" });
    }
  } catch (err) {
    req.log.error({ err }, "Test connection failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /storage/uploads/direct — server-side upload to configured provider */
router.post(
  "/storage/uploads/direct",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File tidak ditemukan di request" });
        return;
      }

      const provider = await getStorageProvider();
      const { buffer, originalname, mimetype } = req.file;

      if (provider === "gdrive_script") {
        const url = await uploadToGDriveScript(buffer, originalname, mimetype);
        res.json({ url, provider: "gdrive_script" });
        return;
      }

      if (provider === "gdrive") {
        const url = await uploadToGoogleDrive(buffer, originalname, mimetype);
        res.json({ url, provider: "gdrive" });
        return;
      }

      if (provider === "onedrive") {
        const url = await uploadToOneDrive(buffer, originalname, mimetype);
        res.json({ url, provider: "onedrive" });
        return;
      }

      // GCS: get presigned URL server-side, upload via PUT, return internal path
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: buffer,
        headers: { "Content-Type": mimetype || "application/octet-stream" },
      });

      if (!putRes.ok) throw new Error("GCS upload gagal");

      res.json({ url: `/api/storage${objectPath}`, provider: "gcs" });
    } catch (err: any) {
      req.log.error({ err }, "Direct upload failed");
      res.status(500).json({ error: err.message || "Upload gagal" });
    }
  }
);

/** GET /storage/onedrive/connect — redirect to Microsoft OAuth page */
router.get("/storage/onedrive/connect", async (req: Request, res: Response) => {
  try {
    const [clientIdRow] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, "storage_onedrive_client_id"));
    const [tenantRow] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, "storage_onedrive_tenant_id"));

    const clientId = clientIdRow?.value;
    const tenantId = tenantRow?.value || "consumers";

    if (!clientId) {
      res.status(400).send("Client ID belum dikonfigurasi. Silakan simpan konfigurasi OneDrive terlebih dahulu.");
      return;
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${proto}://${host}`;
    const redirectUri = `${baseUrl}/api/storage/onedrive/callback`;

    const authUrl =
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        scope: "https://graph.microsoft.com/Files.ReadWrite offline_access",
        response_mode: "query",
      }).toString();

    res.redirect(authUrl);
  } catch (err) {
    req.log.error({ err }, "Failed to start OneDrive OAuth");
    res.status(500).send("Internal server error");
  }
});

/** GET /storage/onedrive/callback — Microsoft OAuth callback */
router.get("/storage/onedrive/callback", async (req: Request, res: Response) => {
  const closeWithMessage = (type: "success" | "error", msg?: string) => {
    const payload = type === "success"
      ? `{type:"onedrive-auth-success"}`
      : `{type:"onedrive-auth-error",error:"${(msg ?? "").replace(/"/g, '\\"')}"}`;
    res.send(
      `<!DOCTYPE html><html><body><script>
        try { window.opener.postMessage(${payload}, "*"); } catch(e){}
        window.close();
      </script><p>${type === "success" ? "Berhasil! Jendela ini akan menutup..." : "Gagal: " + msg}</p></body></html>`
    );
  };

  try {
    const { code, error } = req.query;

    if (error) {
      closeWithMessage("error", String(error));
      return;
    }
    if (!code) {
      closeWithMessage("error", "Authorization code tidak ditemukan");
      return;
    }

    const [clientIdRow] = await db.select().from(settingsTable).where(eq(settingsTable.key, "storage_onedrive_client_id"));
    const [clientSecretRow] = await db.select().from(settingsTable).where(eq(settingsTable.key, "storage_onedrive_client_secret"));
    const [tenantRow] = await db.select().from(settingsTable).where(eq(settingsTable.key, "storage_onedrive_tenant_id"));

    const clientId = clientIdRow?.value;
    const clientSecret = clientSecretRow?.value ?? "";
    const tenantId = tenantRow?.value || "consumers";

    if (!clientId) {
      closeWithMessage("error", "Client ID tidak ditemukan");
      return;
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const redirectUri = `${proto}://${host}/api/storage/onedrive/callback`;

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code: String(code),
          redirect_uri: redirectUri,
          scope: "https://graph.microsoft.com/Files.ReadWrite offline_access",
        }).toString(),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      req.log.error({ errText }, "OneDrive token exchange failed");
      closeWithMessage("error", "Token exchange gagal");
      return;
    }

    const tokenData = await tokenRes.json();
    if (!tokenData.refresh_token) {
      closeWithMessage("error", "Refresh token tidak diterima — pastikan scope offline_access aktif");
      return;
    }

    await setSetting("storage_onedrive_refresh_token", tokenData.refresh_token);
    closeWithMessage("success");
  } catch (err: any) {
    req.log.error({ err }, "OneDrive callback error");
    closeWithMessage("error", "Internal error");
  }
});

/** DELETE /storage/onedrive/disconnect — remove refresh token */
router.delete("/storage/onedrive/disconnect", async (req: Request, res: Response) => {
  try {
    await deleteSetting("storage_onedrive_refresh_token");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to disconnect OneDrive");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
