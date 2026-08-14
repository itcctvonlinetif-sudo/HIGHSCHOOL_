import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Readable } from "stream";

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  if (!row) return null;
  return row.value === "__null__" ? null : row.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
}

export async function deleteSetting(key: string): Promise<void> {
  await db.delete(settingsTable).where(eq(settingsTable.key, key));
}

export async function getStorageProvider(): Promise<string> {
  return (await getSetting("storage_provider")) ?? "gcs";
}

export async function getStorageConfig() {
  const provider = (await getSetting("storage_provider")) ?? "gcs";
  const gdriveCredentials = await getSetting("storage_gdrive_credentials");
  const gdriveFolderId = await getSetting("storage_gdrive_folder_id");
  const gdriveScriptUrl = await getSetting("storage_gdrive_script_url");
  const onedriveClientId = await getSetting("storage_onedrive_client_id");
  const onedriveClientSecret = await getSetting("storage_onedrive_client_secret");
  const onedriveTenantId = await getSetting("storage_onedrive_tenant_id");
  const onedriveFolderPath = await getSetting("storage_onedrive_folder_path");
  const onedriveConnected = !!(await getSetting("storage_onedrive_refresh_token"));

  return {
    provider,
    gdrive: {
      hasCredentials: !!gdriveCredentials,
      folderId: gdriveFolderId ?? "",
    },
    gdriveScript: {
      scriptUrl: gdriveScriptUrl ?? "",
      folderId: gdriveFolderId ?? "",
    },
    onedrive: {
      clientId: onedriveClientId ?? "",
      hasClientSecret: !!onedriveClientSecret,
      tenantId: onedriveTenantId ?? "consumers",
      folderPath: onedriveFolderPath ?? "mosque-uploads",
      connected: onedriveConnected,
    },
  };
}

/** Upload via Google Apps Script web app — no Cloud Console needed */
export async function uploadToGDriveScript(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const scriptUrl = await getSetting("storage_gdrive_script_url");
  if (!scriptUrl) throw new Error("Apps Script URL belum dikonfigurasi");

  const folderId = await getSetting("storage_gdrive_folder_id");
  const payload: Record<string, string> = {
    file: buffer.toString("base64"),
    fileName: `${Date.now()}-${filename}`,
    mimeType: mimeType || "application/octet-stream",
  };
  if (folderId) payload.folderId = folderId;

  const res = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Respons tidak valid dari Apps Script: ${text.slice(0, 200)}`);
  }

  if (!data.success) throw new Error(data.error || "Upload ke Google Drive gagal");
  return data.url;
}

export async function uploadToGoogleDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const credStr = await getSetting("storage_gdrive_credentials");
  const folderId = await getSetting("storage_gdrive_folder_id");

  if (!credStr) throw new Error("Google Drive credentials belum dikonfigurasi");

  let credentials: any;
  try {
    credentials = JSON.parse(credStr);
  } catch {
    throw new Error("Format credentials Google Drive tidak valid (harus JSON)");
  }

  const { google } = await import("googleapis");

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });

  const uniqueName = `${Date.now()}-${filename}`;
  const requestBody: any = { name: uniqueName, mimeType };
  if (folderId) requestBody.parents = [folderId];

  const response = await drive.files.create({
    requestBody,
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id",
  });

  const fileId = response.data.id!;

  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return `https://drive.google.com/uc?id=${fileId}&export=view`;
}

async function refreshOneDriveToken(
  clientId: string,
  clientSecret: string,
  tenantId: string,
  refreshToken: string
): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        scope: "https://graph.microsoft.com/Files.ReadWrite offline_access",
      }).toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal memperbarui token OneDrive: ${text}`);
  }

  const data = await res.json();

  if (data.refresh_token) {
    await setSetting("storage_onedrive_refresh_token", data.refresh_token);
  }

  return data.access_token;
}

export async function getOneDriveAccessToken(): Promise<string> {
  const clientId = await getSetting("storage_onedrive_client_id");
  const clientSecret = await getSetting("storage_onedrive_client_secret");
  const tenantId = (await getSetting("storage_onedrive_tenant_id")) ?? "consumers";
  const refreshToken = await getSetting("storage_onedrive_refresh_token");

  if (!clientId) throw new Error("OneDrive Client ID belum dikonfigurasi");
  if (!refreshToken) throw new Error("OneDrive belum dihubungkan. Klik 'Hubungkan OneDrive' di pengaturan.");

  return refreshOneDriveToken(clientId, clientSecret ?? "", tenantId, refreshToken);
}

export async function uploadToOneDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const folderPath = (await getSetting("storage_onedrive_folder_path")) ?? "mosque-uploads";
  const token = await getOneDriveAccessToken();
  const uniqueName = `${Date.now()}-${filename}`;

  const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(folderPath)}/${encodeURIComponent(uniqueName)}:/content`;

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": mimeType,
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`OneDrive upload gagal: ${text}`);
  }

  const fileData = await uploadRes.json();

  const shareRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${fileData.id}/createLink`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "view", scope: "anonymous" }),
    }
  );

  const shareData = await shareRes.json();
  return shareData.link?.webUrl ?? fileData.webUrl;
}
