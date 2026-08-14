#!/bin/bash
# setup-if-needed.sh
# Dipanggil otomatis oleh artifact workflow saat pertama kali dijalankan.
# Aman dijalankan berkali-kali — hanya melakukan pekerjaan jika diperlukan.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DONE_MARKER="$ROOT/node_modules/.setup-done"

if [ ! -f "$DONE_MARKER" ]; then
  echo "🔧 Pertama kali dijalankan — menyiapkan project..."
  echo ""

  echo "📦 Menginstall dependensi..."
  pnpm -C "$ROOT" install
  echo "✅ Dependensi berhasil diinstall"
  echo ""

  if [ -n "$DATABASE_URL" ]; then
    echo "🗄️  Menerapkan skema database..."
    pnpm -C "$ROOT" --filter @workspace/db run push \
      && echo "✅ Skema database berhasil diterapkan" \
      || echo "⚠️  DB push gagal — jalankan manual: pnpm --filter db push"
    echo ""
  else
    echo "⚠️  DATABASE_URL belum diset — lewati setup database"
    echo "   Provision database terlebih dahulu, lalu jalankan: pnpm --filter db push"
    echo ""
  fi

  touch "$DONE_MARKER"
  echo "✅ Setup selesai!"
  echo ""
fi
