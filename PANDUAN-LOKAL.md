# 🕌 Panduan Migrasi Website ke Server Lokal Ubuntu

Panduan ini untuk pemula yang ingin menjalankan website Musholla/Masjid ini di komputer atau server Ubuntu sendiri menggunakan Git.

---

## 📋 Daftar Isi

1. [Persyaratan Sistem](#1-persyaratan-sistem)
2. [Instalasi Software yang Dibutuhkan](#2-instalasi-software-yang-dibutuhkan)
3. [Clone Project dari GitHub](#3-clone-project-dari-github)
4. [Setup Database PostgreSQL](#4-setup-database-postgresql)
5. [Konfigurasi Environment Variables](#5-konfigurasi-environment-variables)
6. [Instal Dependensi & Inisialisasi](#6-instal-dependensi--inisialisasi)
7. [Menjalankan Website](#7-menjalankan-website)
8. [Setup Otomatis dengan PM2 (Rekomendasi)](#8-setup-otomatis-dengan-pm2-rekomendasi)
9. [Akses Website dari Browser](#9-akses-website-dari-browser)
10. [Update Website dari GitHub](#10-update-website-dari-github)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Persyaratan Sistem

- **OS:** Ubuntu 22.04 LTS atau 24.04 LTS (direkomendasikan)
- **RAM:** Minimal 1 GB (rekomendasi 2 GB)
- **Storage:** Minimal 5 GB kosong
- **Koneksi internet** untuk download package

---

## 2. Instalasi Software yang Dibutuhkan

Buka **Terminal** di Ubuntu, lalu jalankan perintah-perintah berikut satu per satu.

### 2.1 Update sistem terlebih dahulu

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Git

```bash
sudo apt install git -y
git --version
```

Jika berhasil, akan tampil versi Git seperti: `git version 2.43.0`

### 2.3 Install Node.js versi 22 (menggunakan NVM)

NVM (Node Version Manager) adalah cara termudah untuk install Node.js.

```bash
# Download dan install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Muat ulang konfigurasi terminal (PENTING - jangan skip)
source ~/.bashrc

# Verifikasi NVM terinstall
nvm --version

# Install Node.js versi 22
nvm install 22

# Gunakan Node.js versi 22
nvm use 22

# Set sebagai default
nvm alias default 22

# Verifikasi
node --version   # harus tampil v22.x.x
npm --version
```

### 2.4 Install pnpm (Package Manager)

Project ini menggunakan pnpm, bukan npm biasa.

```bash
npm install -g pnpm

# Verifikasi
pnpm --version   # harus tampil 10.x.x
```

### 2.5 Install PostgreSQL (Database)

```bash
sudo apt install postgresql postgresql-contrib -y

# Jalankan dan aktifkan PostgreSQL otomatis saat startup
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verifikasi PostgreSQL berjalan
sudo systemctl status postgresql
```

Jika tampil `Active: active (running)` berarti berhasil. Tekan `Q` untuk keluar.

---

## 3. Clone Project dari GitHub

### 3.1 Buat folder untuk project

```bash
# Pindah ke folder home
cd ~

# Clone repository dari GitHub (ganti URL sesuai repo Anda)
git clone https://github.com/NAMA_AKUN/NAMA_REPO.git

# Masuk ke folder project
cd NAMA_REPO
```

> 💡 **Catatan:** Ganti `https://github.com/NAMA_AKUN/NAMA_REPO.git` dengan URL repository GitHub Anda yang sebenarnya.

---

## 4. Setup Database PostgreSQL

### 4.1 Buat user dan database baru

```bash
# Masuk sebagai user postgres
sudo -u postgres psql
```

Setelah masuk ke PostgreSQL prompt (`postgres=#`), jalankan perintah berikut:

```sql
-- Buat user database (ganti 'password_anda' dengan password yang kuat)
CREATE USER masjid_user WITH PASSWORD 'password_anda';

-- Buat database
CREATE DATABASE masjid_db OWNER masjid_user;

-- Beri akses
GRANT ALL PRIVILEGES ON DATABASE masjid_db TO masjid_user;

-- Keluar dari PostgreSQL
\q
```

### 4.2 Verifikasi koneksi database

```bash
psql -U masjid_user -d masjid_db -h localhost -c "SELECT version();"
```

Masukkan password yang tadi dibuat. Jika tampil versi PostgreSQL, berarti berhasil.

---

## 5. Konfigurasi Environment Variables

Environment variables adalah pengaturan rahasia yang tidak disimpan di GitHub (seperti password database).

Cukup buat **satu file `.env` di folder root project** — semua bagian website (database, seed, API server) akan membacanya secara otomatis.

### 5.1 Buat file .env di root project

```bash
# Pastikan Anda berada di folder project
cd ~/NAMA_REPO

# Buat file .env
nano .env
```

Isi file `.env` dengan konten berikut (sesuaikan dengan data Anda):

```env
# Database — format: postgresql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE
DATABASE_URL=postgresql://masjid_user:password_anda@localhost:5432/masjid_db

# Secret untuk session (buat string acak yang panjang, minimal 32 karakter)
SESSION_SECRET=ganti_dengan_string_acak_panjang_contoh_xK9mP2qL8nR5vT1wJ4
```

Simpan file dengan tekan `Ctrl+X`, lalu `Y`, lalu `Enter`.

> ⚠️ **PENTING:** Ganti `password_anda` dengan password yang Anda buat di langkah 4.1, dan ganti `SESSION_SECRET` dengan string acak yang panjang (tidak boleh sama antar instalasi).

> 💡 **Catatan:** File `.env` ini sudah cukup untuk satu kali setup. Sistem secara otomatis akan menemukan file ini dari folder manapun di dalam project.

---

## 6. Instal Dependensi & Inisialisasi

### 6.1 Install semua package yang dibutuhkan

```bash
# Pastikan berada di folder root project
cd ~/NAMA_REPO

# Install semua dependensi (akan memakan beberapa menit)
pnpm install
```

Tunggu hingga selesai. Akan tampil pesan sukses di akhir.

### 6.2 Buat tabel-tabel database

Perintah ini akan membuat semua tabel yang dibutuhkan di database secara otomatis:

```bash
pnpm --filter db push
```

Jika berhasil, akan tampil daftar tabel yang berhasil dibuat (admin_users, news, events, dll.)

### 6.3 Isi database dengan data awal

Perintah ini akan mengisi database dengan data contoh (berita, galeri, menu, dll.):

```bash
pnpm --filter @workspace/scripts run seed
```

Jika berhasil, akan tampil:
```
🌱 Memulai seed database...
✅ Admin: username=admin | password=istiqlal2024
✅ Settings berhasil diisi
✅ Menu berhasil dibuat
... dst
```

> 🔐 **Catat:** Username admin = `admin`, Password = `istiqlal2024` — **Segera ganti password** setelah pertama kali login!

### 6.4 Build API Server

```bash
# Build API server terlebih dahulu
cd artifacts/api-server
PORT=8080 pnpm run build
cd ~/NAMA_REPO
```

---

## 7. Menjalankan Website

Ada dua cara: **Manual** (untuk testing) atau **Otomatis dengan PM2** (untuk server permanen).

### 7.1 Cara Manual (untuk testing/development)

Buka **dua terminal** secara bersamaan:

**Terminal 1 — Jalankan API Server (Backend):**
```bash
cd ~/NAMA_REPO
PORT=8080 pnpm --filter @workspace/api-server run start
```

**Terminal 2 — Jalankan Frontend (Website):**
```bash
cd ~/NAMA_REPO
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/masjid-istiqlal run dev
```

Website dapat diakses di: **http://localhost:3000**

> 💡 Untuk menghentikan, tekan `Ctrl+C` di masing-masing terminal.

---

## 8. Setup Otomatis dengan PM2 (Rekomendasi)

PM2 akan menjalankan website secara otomatis di background, dan akan restart otomatis jika server reboot.

### 8.1 Install PM2

```bash
npm install -g pm2
```

### 8.2 Buat file konfigurasi PM2

```bash
cd ~/NAMA_REPO
nano ecosystem.config.cjs
```

Isi dengan (ganti `/var/www/webapp` dengan path folder project Anda, cek dengan `pwd`):

```javascript
const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");

// Baca .env dari root project secara otomatis
function loadEnv() {
  const envPath = resolve(__dirname, ".env");
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = val;
    }
  }
  return env;
}

const dotenv = loadEnv();

module.exports = {
  apps: [
    {
      name: "masjid-api",
      script: "./artifacts/api-server/dist/index.mjs",
      env: {
        PORT: 8080,
        NODE_ENV: "production",
        DATABASE_URL: dotenv.DATABASE_URL,
        SESSION_SECRET: dotenv.SESSION_SECRET,
      }
    },
    {
      name: "masjid-web",
      script: "pnpm",
      args: "--filter @workspace/masjid-istiqlal run dev",
      env: {
        PORT: 3000,
        BASE_PATH: "/",
        NODE_ENV: "development",
      }
    }
  ]
}
```

Simpan dengan `Ctrl+X`, `Y`, `Enter`.

> 💡 **Catatan:** Script di atas membaca otomatis dari file `.env` yang sudah Anda buat di langkah 5. Tidak perlu mengetik ulang password di sini.

### 8.3 Build API terlebih dahulu

```bash
cd ~/NAMA_REPO/artifacts/api-server
PORT=8080 pnpm run build
cd ~/NAMA_REPO
```

### 8.4 Jalankan dengan PM2

```bash
pm2 start ecosystem.config.cjs

# Lihat status
pm2 status

# Lihat log
pm2 logs

# Set agar otomatis berjalan saat reboot
pm2 startup
# Ikuti instruksi yang muncul (copy-paste perintah yang ditampilkan)
pm2 save
```

### 8.5 Perintah PM2 yang berguna

```bash
pm2 status          # Lihat status semua aplikasi
pm2 logs            # Lihat log semua aplikasi
pm2 logs masjid-api # Lihat log API saja
pm2 restart all     # Restart semua
pm2 stop all        # Hentikan semua
pm2 delete all      # Hapus semua dari PM2
```

---

## 9. Akses Website dari Browser

Setelah semua berjalan:

| Halaman | URL |
|---------|-----|
| Website utama | http://localhost:3000 |
| Halaman admin | http://localhost:3000/admin |
| Login admin | Username: `admin` / Password: `istiqlal2024` |

Jika diakses dari komputer lain di jaringan yang sama, ganti `localhost` dengan IP address server Ubuntu:

```bash
# Cek IP address server
hostname -I
```

Contoh: jika IP adalah `192.168.1.10`, akses di `http://192.168.1.10:3000`

---

## 10. Update Website dari GitHub

Setiap kali ada perubahan di GitHub, lakukan langkah berikut:

```bash
cd ~/NAMA_REPO

# Download perubahan terbaru dari GitHub
git pull origin main

# Install dependensi baru (jika ada)
pnpm install

# Update database (jika ada perubahan skema)
pnpm --filter db push

# Update data seed (isi database baru jika ada)
pnpm --filter @workspace/scripts run seed

# Build ulang API server
cd artifacts/api-server
PORT=8080 pnpm run build
cd ~/NAMA_REPO

# Restart aplikasi (jika menggunakan PM2)
pm2 restart all
```

---

## 11. Troubleshooting

### ❌ Error: "DATABASE_URL must be set" atau "DATABASE_URL, ensure the database is provisioned"

**Penyebab:** File `.env` tidak ditemukan atau salah isi.

**Solusi:**
```bash
# Cek apakah file .env ada di ROOT folder project
ls -la .env
cat .env

# Jika belum ada, buat sesuai langkah 5.1:
nano .env
# Isi dengan:
# DATABASE_URL=postgresql://masjid_user:password_anda@localhost:5432/masjid_db
# SESSION_SECRET=string_acak_panjang

# Pastikan format DATABASE_URL benar (tidak ada spasi, tanda kutip, dll.)

# Setelah .env dibuat, jalankan ulang setup database:
pnpm --filter db push
```

---

### ❌ Error: "PORT environment variable is required"

**Penyebab:** Menjalankan tanpa menyertakan PORT.

**Solusi:** Selalu jalankan dengan PORT, contoh:
```bash
PORT=8080 pnpm --filter @workspace/api-server run start
```

---

### ❌ Error: "password authentication failed for user"

**Penyebab:** Password database salah atau user belum dibuat.

**Solusi:**
```bash
# Reset password user PostgreSQL
sudo -u postgres psql
ALTER USER masjid_user WITH PASSWORD 'password_baru';
\q

# Update .env dengan password baru (file ada di root project)
nano .env
```

---

### ❌ Error: "connection refused" di port 5432

**Penyebab:** PostgreSQL tidak berjalan.

**Solusi:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

---

### ❌ Website bisa diakses di localhost tapi tidak dari komputer lain

**Penyebab:** Firewall Ubuntu memblokir port.

**Solusi:**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
sudo ufw status
```

---

### ❌ Error setelah `git pull`: "pnpm: not found"

**Penyebab:** Session terminal baru, NVM belum dimuat.

**Solusi:**
```bash
source ~/.bashrc
nvm use 22
```

---

## 📌 Ringkasan Perintah Penting

```bash
# Jalankan manual (dua terminal)
PORT=8080 pnpm --filter @workspace/api-server run start
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/masjid-istiqlal run dev

# Seed ulang database (jika data terhapus)
pnpm --filter @workspace/scripts run seed

# Reset + isi ulang data paksa
pnpm --filter @workspace/scripts run seed -- --force

# Build ulang API
cd artifacts/api-server && PORT=8080 pnpm run build && cd ../..

# PM2: lihat status
pm2 status

# PM2: restart
pm2 restart all

# Update dari GitHub (lengkap)
git pull origin main
pnpm install
pnpm --filter db push
cd artifacts/api-server && pnpm run build && cd ../..
pm2 restart all
```

---

## 12. Catatan Node.js

Proyek ini dikembangkan di Replit menggunakan **Node.js 24**. Untuk server Ubuntu lokal, **Node.js 22 LTS** sudah cukup dan kompatibel penuh karena tidak ada fitur Node.js 24-spesifik yang digunakan.

Jika di kemudian hari muncul error terkait versi Node.js, upgrade ke versi yang lebih baru:

```bash
nvm install 24
nvm use 24
nvm alias default 24
```

---

*Panduan ini dibuat untuk Ubuntu 22.04/24.04 LTS dengan Node.js 22/24 dan PostgreSQL 14+.*
