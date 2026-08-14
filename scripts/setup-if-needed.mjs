#!/usr/bin/env node
/**
 * setup-if-needed.mjs
 * Dipanggil dari dev script di setiap artifact package.json.
 * Hanya menggunakan built-in Node.js — aman dijalankan meski node_modules belum ada.
 * Aman dijalankan berkali-kali: hanya bekerja saat pertama kali.
 */
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MARKER = resolve(ROOT, "node_modules", ".setup-done");

if (!existsSync(MARKER)) {
  console.log("🔧 Pertama kali dijalankan — menyiapkan project...\n");

  console.log("📦 Menginstall dependensi...");
  execSync("pnpm install", { cwd: ROOT, stdio: "inherit" });
  console.log("✅ Dependensi berhasil diinstall\n");

  if (process.env.DATABASE_URL) {
    console.log("🗄️  Menerapkan skema database...");
    try {
      execSync("pnpm --filter @workspace/db run push", { cwd: ROOT, stdio: "inherit" });
      console.log("✅ Skema database berhasil diterapkan\n");
    } catch {
      console.log("⚠️  DB push gagal — jalankan manual: pnpm --filter db push\n");
    }
  } else {
    console.log("⚠️  DATABASE_URL belum diset — lewati setup database");
    console.log("   Provision database, lalu jalankan: pnpm --filter db push\n");
  }

  mkdirSync(resolve(ROOT, "node_modules"), { recursive: true });
  writeFileSync(MARKER, "");
  console.log("✅ Setup selesai!\n");
}
