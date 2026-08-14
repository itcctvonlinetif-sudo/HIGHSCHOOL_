import bcrypt from "bcryptjs";
import {
  db,
  adminUsersTable,
  settingsTable,
  prayerTimesTable,
  newsTable,
  eventsTable,
  galleryTable,
  menusTable,
  pagesTable,
  cctvTable,
  layananTable,
} from "@workspace/db";

const FORCE = process.argv.includes("--force");

async function seed() {
  // Check if database is already seeded
  if (!FORCE) {
    const existing = await db.select().from(adminUsersTable).limit(1);
    if (existing.length > 0) {
      console.log("✅ Database sudah memiliki data. Lewati seed.");
      console.log("   Jalankan dengan --force untuk mengisi ulang: pnpm run seed -- --force");
      process.exit(0);
    }
  }

  console.log("🌱 Memulai seed database Musholla Nurul Iman...\n");

  // ─── Admin User ─────────────────────────────────────────────────────────────
  console.log("👤 Membuat admin user...");
  await db.delete(adminUsersTable);
  const passwordHash = await bcrypt.hash("istiqlal2024", 10);
  await db.insert(adminUsersTable).values({
    username: "admin",
    passwordHash,
    email: "admin@istiqlal.or.id",
  });
  console.log("   ✅ Admin: username=admin | password=istiqlal2024\n");

  // ─── Site Settings ───────────────────────────────────────────────────────────
  console.log("⚙️  Mengisi site settings...");
  await db.delete(settingsTable);
  await db.insert(settingsTable).values([
    { key: "siteName", value: "Musholla Nurul Iman" },
    { key: "tagline", value: "Musholla Nurul Iman Petukangan Utara" },
    { key: "description", value: "Musholla Nurul Iman adalah masjid nasional negara Republik Indonesia yang terletak di Jakarta Pusat. Masjid ini merupakan masjid terbesar di Asia Tenggara." },
    { key: "heroTitle", value: "Musholla Nurul Iman" },
    { key: "heroSubtitle", value: "Simbol Kemerdekaan, Toleransi, dan Peradaban Islam" },
    { key: "heroImageUrl", value: "" },
    { key: "address", value: "Jl. Taman Wijaya Kusuma, Ps. Baru, Kec. Sawah Besar, Kota Jakarta Pusat, DKI Jakarta 10710" },
    { key: "phone", value: "(021) 345-1523" },
    { key: "email", value: "imannrl31@gmail.com" },
    { key: "mapUrl", value: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.8937816199026!2d106.74584625273336!3d-6.224050505888154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f1003f538469%3A0x942d93484658a9e3!2sMusholla%20Nurul%20Iman!5e0!3m2!1sen!2sid!4v1774938228782!5m2!1sen!2sid" },
    { key: "facebookUrl", value: "https://facebook.com/MasjidIstiqlalOfficial" },
    { key: "instagramUrl", value: "https://instagram.com/masjidistiqlal_official" },
    { key: "youtubeUrl", value: "https://youtube.com/@MasjidIstiqlal" },
    { key: "twitterUrl", value: "https://twitter.com/MasjidIstiqlal" },
    { key: "facebook", value: "https://www.facebook.com/mushollanuruliman" },
    { key: "instagram", value: "https://www.instagram.com/mushollanuruliman" },
    { key: "twitter", value: "" },
    { key: "youtube", value: "https://www.youtube.com/mushollanuruliman" },
    { key: "smtpGmail", value: "" },
    { key: "smtpPassword", value: "" },
    { key: "smtpRecipient", value: "" },
  ]);
  console.log("   ✅ Settings berhasil diisi\n");

  // ─── Prayer Times ────────────────────────────────────────────────────────────
  console.log("🕌 Mengisi jadwal sholat...");
  await db.delete(prayerTimesTable);
  await db.insert(prayerTimesTable).values({
    fajr: "04:45",
    dhuhr: "12:00",
    asr: "15:15",
    maghrib: "18:05",
    isha: "19:15",
    jumuah: "12:00",
    updatedAt: new Date().toISOString(),
  });
  console.log("   ✅ Jadwal sholat berhasil diisi\n");

  // ─── Navigation Menus ────────────────────────────────────────────────────────
  console.log("📋 Membuat menu navigasi...");
  await db.delete(menusTable);
  await db.insert(menusTable).values([
    { label: "Beranda", url: "/", order: 1, isActive: true },
    { label: "Profil", url: "/profil", order: 2, isActive: true },
    { label: "Berita", url: "/berita", order: 3, isActive: true },
    { label: "Kegiatan", url: "/kegiatan", order: 4, isActive: true },
    { label: "Galeri", url: "/galeri", order: 5, isActive: true },
    { label: "CCTV", url: "/cctv", order: 6, isActive: true },
    { label: "Panduan Berkunjung", url: "/halaman/panduan-berkunjung", order: 7, isActive: true },
    { label: "App", url: "/halaman/aplikasi", order: 8, isActive: true },
    { label: "Kontak", url: "/kontak", order: 9, isActive: true },
  ]);
  console.log("   ✅ Menu berhasil dibuat\n");

  // ─── Layanan ─────────────────────────────────────────────────────────────────
  console.log("🛎️  Mengisi layanan...");
  await db.delete(layananTable);
  await db.insert(layananTable).values([
    {
      title: "Pendaftaran Nikah",
      description: "Layanan pendaftaran pernikahan di Musholla Nurul Iman untuk pasangan muslim.",
      icon: "Heart",
      order: 1,
      isActive: true,
      popupEnabled: true,
      popupTitle: "Pendaftaran Pernikahan",
      popupSubtitle: "Wujudkan pernikahan sakral di Masjid terbesar Asia Tenggara",
      popupImageUrl: "",
      popupInstructions:
        "Datang ke kantor administrasi Musholla Nurul Iman\nBawa fotokopi KTP calon mempelai (2 lembar)\nBawa fotokopi kartu keluarga (2 lembar)\nBawa surat pengantar dari RT/RW\nIsi formulir pendaftaran di loket\nLunasi biaya administrasi",
      popupHighlightTitle: "Biaya & Jadwal",
      popupHighlightContent:
        "Biaya administrasi: Rp 500.000\nJadwal hari kerja: Senin–Jumat, 08.00–15.00 WIB\nHubungi: (021) 345-1523",
    },
    {
      title: "Kunjungan Wisata",
      description: "Kunjungi Musholla Nurul Iman sebagai destinasi wisata religi dan budaya Jakarta.",
      icon: "MapPin",
      order: 2,
      isActive: true,
      popupEnabled: true,
      popupTitle: "Wisata Religi Musholla Nurul Iman",
      popupSubtitle: "Jelajahi keindahan arsitektur dan sejarah Masjid Nasional Indonesia",
      popupImageUrl: "",
      popupInstructions:
        "Kunjungan tersedia setiap hari kecuali waktu sholat\nWaktu kunjungan: 09.00–17.00 WIB\nGunakan pakaian sopan dan menutup aurat\nPandu wisata tersedia dengan reservasi sebelumnya\nDisarankan mendaftar secara online",
      popupHighlightTitle: "Informasi Kunjungan",
      popupHighlightContent: "Gratis untuk umum\nKapasitas: 200.000 jamaah\nHubungi: wisata@istiqlal.or.id",
    },
    {
      title: "Kajian Islam",
      description: "Program kajian dan pengajian Islam rutin yang diselenggarakan setiap minggu.",
      icon: "BookOpen",
      order: 3,
      isActive: true,
      popupEnabled: false,
      linkUrl: "/kegiatan",
    },
    {
      title: "Infak & Sedekah",
      description: "Salurkan infak dan sedekah Anda untuk mendukung kegiatan Musholla Nurul Iman.",
      icon: "Gift",
      order: 4,
      isActive: true,
      popupEnabled: true,
      popupTitle: "Infak & Sedekah",
      popupSubtitle: "Berkontribusi untuk kemajuan Musholla Nurul Iman dan umat Islam Indonesia",
      popupImageUrl: "",
      popupInstructions:
        "Transfer melalui rekening bank yang tertera\nSertakan nama dan nomor telepon sebagai keterangan\nKonfirmasi transfer via email atau telepon\nTanda terima akan dikirimkan melalui email",
      popupHighlightTitle: "Rekening Donasi",
      popupHighlightContent:
        "Bank Mandiri: 1230009876543\nBank BRI: 0123-01-012345-30-6\nBank BNI: 1234567890\nA/n: Yayasan Musholla Nurul Iman",
    },
    {
      title: "Ambulans Jenazah",
      description: "Layanan ambulans jenazah gratis bagi jamaah yang membutuhkan.",
      icon: "Shield",
      order: 5,
      isActive: true,
      popupEnabled: true,
      popupTitle: "Layanan Ambulans Jenazah",
      popupSubtitle: "Layanan sosial gratis 24 jam untuk umat",
      popupImageUrl: "",
      popupInstructions:
        "Hubungi nomor darurat yang tersedia 24 jam\nSampaikan lokasi penjemputan dengan jelas\nSiapkan dokumen identitas almarhum/almarhumah\nPetugas akan tiba dalam waktu kurang dari 30 menit",
      popupHighlightTitle: "Kontak Darurat",
      popupHighlightContent:
        "Hotline 24 jam: (021) 345-9999\nWhatsApp: 0812-3456-7890\nGratis, tanpa biaya apapun",
    },
    {
      title: "Museum Istiqlal",
      description: "Kunjungi museum sejarah Musholla Nurul Iman dan koleksi peninggalan bersejarah.",
      icon: "Building",
      order: 6,
      isActive: true,
      popupEnabled: false,
      linkUrl: "/halaman/museum-istiqlal",
    },
  ]);
  console.log("   ✅ Layanan berhasil diisi\n");

  // ─── News ─────────────────────────────────────────────────────────────────────
  console.log("📰 Membuat berita...");
  await db.delete(newsTable);
  await db.insert(newsTable).values([
    {
      title: "Musholla Nurul Iman Kembali Gelar Kajian Rutin Ramadan 1447 H",
      slug: "kajian-rutin-ramadan-1447",
      content: `<p>Musholla Nurul Iman Jakarta kembali menyelenggarakan program kajian rutin menyambut bulan suci Ramadan 1447 H. Program kajian ini akan diisi oleh para ulama dan cendekiawan muslim terkemuka dari seluruh Indonesia.</p>
<p>Kajian akan dilaksanakan setiap hari selama bulan Ramadan, mulai pukul 08.00 hingga 10.00 WIB dan dilanjutkan setelah sholat Ashar hingga menjelang Maghrib. Tema kajian tahun ini adalah "Memperkuat Ukhuwah Islamiyah di Era Digital".</p>
<p>Imam Besar Musholla Nurul Iman, Prof. Dr. KH. Nasaruddin Umar, menyampaikan bahwa program ini terbuka untuk seluruh masyarakat dan jamaah dari berbagai latar belakang. "Kami mengundang seluruh umat Islam untuk hadir dan memperdalam ilmu agama," ujarnya.</p>
<p>Selain kajian reguler, Musholla Nurul Iman juga akan menyelenggarakan sholat Tarawih berjamaah dengan kapasitas 200.000 jamaah, tadarus Al-Quran, dan berbagai program sosial selama bulan Ramadan.</p>`,
      excerpt: "Musholla Nurul Iman kembali menggelar program kajian rutin Ramadan dengan tema Memperkuat Ukhuwah Islamiyah di Era Digital, terbuka untuk seluruh masyarakat.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news1/800/500",
      author: "Tim Redaksi Istiqlal",
      isPublished: true,
      publishedAt: new Date("2026-02-20T08:00:00"),
    },
    {
      title: "Renovasi Selesai, Musholla Nurul Iman Tampil Lebih Modern dan Nyaman",
      slug: "renovasi-selesai-masjid-istiqlal-lebih-modern",
      content: `<p>Proyek renovasi besar-besaran Musholla Nurul Iman yang dimulai sejak tahun 2019 akhirnya tuntas sepenuhnya. Masjid Nasional Indonesia ini kini tampil lebih modern, bersih, dan nyaman bagi jamaah yang datang dari seluruh penjuru Indonesia maupun mancanegara.</p>
<p>Beberapa perubahan signifikan yang dilakukan antara lain peningkatan sistem pendingin udara, renovasi kamar mandi dan tempat wudhu, penambahan lift untuk jamaah berkebutuhan khusus, serta pemasangan sistem audio visual modern.</p>
<p>Kapasitas masjid juga ditingkatkan sehingga dapat menampung hingga 200.000 jamaah sekaligus, menjadikannya salah satu masjid dengan kapasitas terbesar di dunia.</p>
<p>Direktur Utama Badan Pengelola Musholla Nurul Iman menyampaikan apresiasi kepada seluruh pihak yang terlibat dalam proses renovasi. "Ini adalah wujud nyata perhatian pemerintah dan masyarakat terhadap rumah Allah yang menjadi kebanggaan seluruh umat Islam Indonesia," katanya.</p>`,
      excerpt: "Renovasi besar-besaran Musholla Nurul Iman telah selesai. Masjid kini tampil lebih modern dengan sistem pendingin baru, tempat wudhu yang diperluas, dan kapasitas 200.000 jamaah.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news2/800/500",
      author: "Tim Redaksi Istiqlal",
      isPublished: true,
      publishedAt: new Date("2026-01-15T09:00:00"),
    },
    {
      title: "Program Beasiswa Santri Musholla Nurul Iman 2026 Dibuka",
      slug: "program-beasiswa-santri-2026-dibuka",
      content: `<p>Musholla Nurul Iman Jakarta membuka pendaftaran Program Beasiswa Santri 2026 untuk generasi muda muslim yang berprestasi dan membutuhkan dukungan finansial dalam melanjutkan pendidikan mereka.</p>
<p>Program beasiswa ini mencakup biaya pendidikan penuh, tunjangan hidup bulanan, akomodasi di asrama Musholla Nurul Iman, serta bimbingan intensif dari para ulama dan akademisi terkemuka.</p>
<p>Syarat pendaftaran:</p>
<ul>
<li>Warga negara Indonesia dan beragama Islam</li>
<li>Usia maksimal 25 tahun</li>
<li>IPK minimal 3.5 atau nilai rapor rata-rata 85</li>
<li>Tidak sedang menerima beasiswa lain</li>
<li>Hafiz/hafidzah minimal 5 juz Al-Quran menjadi nilai plus</li>
</ul>
<p>Pendaftaran dibuka mulai 1 April hingga 30 April 2026. Informasi lengkap dan formulir pendaftaran dapat diunduh melalui website resmi Musholla Nurul Iman.</p>`,
      excerpt: "Program Beasiswa Santri Musholla Nurul Iman 2026 dibuka untuk generasi muda muslim berprestasi. Mencakup biaya pendidikan penuh, tunjangan bulanan, dan bimbingan ulama.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news3/800/500",
      author: "Divisi Pendidikan Istiqlal",
      isPublished: true,
      publishedAt: new Date("2026-03-10T07:00:00"),
    },
    {
      title: "Peresmian Taman Refleksi Istiqlal-Katedral",
      slug: "peresmian-taman-refleksi-istiqlal-katedral",
      content: `<p>Taman Refleksi yang menghubungkan area Musholla Nurul Iman dan Katedral Jakarta secara resmi dibuka untuk umum. Taman ini menjadi simbol nyata kerukunan antarumat beragama di Indonesia yang telah lama menjadi kebanggaan bangsa.</p>
<p>Taman ini dilengkapi dengan jalur pedestrian yang nyaman, area duduk, instalasi seni yang mencerminkan nilai-nilai toleransi, serta papan informasi sejarah hubungan kedua rumah ibadah bersejarah ini.</p>
<p>Pembukaan taman dihadiri oleh Menteri Agama Republik Indonesia, Pimpinan Konferensi Waligereja Indonesia, serta Imam Besar Musholla Nurul Iman. Keduanya menekankan bahwa taman ini adalah simbol bahwa keberagaman adalah kekuatan Indonesia.</p>`,
      excerpt: "Taman Refleksi Istiqlal-Katedral resmi dibuka untuk umum, menjadi simbol kerukunan antarumat beragama yang menghubungkan dua rumah ibadah bersejarah di Jakarta.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news4/800/500",
      author: "Tim Humas Istiqlal",
      isPublished: true,
      publishedAt: new Date("2026-02-05T10:00:00"),
    },
    {
      title: "Musholla Nurul Iman Raih Penghargaan Green Building Internasional",
      slug: "masjid-istiqlal-green-building-internasional",
      content: `<p>Musholla Nurul Iman Jakarta berhasil meraih penghargaan Green Building internasional dari Dewan Bangunan Hijau Dunia (World Green Building Council) atas komitmennya dalam menerapkan prinsip-prinsip bangunan ramah lingkungan.</p>
<p>Penghargaan ini diberikan atas berbagai inovasi lingkungan yang diterapkan dalam renovasi terakhir, antara lain sistem panel surya yang mampu menghasilkan 35% dari kebutuhan listrik masjid, sistem pengolahan air hujan untuk keperluan wudhu, dan penggunaan material bangunan berkelanjutan.</p>`,
      excerpt: "Musholla Nurul Iman meraih penghargaan Green Building internasional atas komitmen lingkungan, termasuk panel surya dan sistem daur ulang air.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news5/800/500",
      author: "Tim Redaksi Istiqlal",
      isPublished: false,
      publishedAt: null,
    },
  ]);
  console.log("   ✅ Berita berhasil dibuat\n");

  // ─── Events ───────────────────────────────────────────────────────────────────
  console.log("📅 Membuat kegiatan...");
  await db.delete(eventsTable);
  await db.insert(eventsTable).values([
    {
      title: "Kajian Subuh Bersama Ustadz Abdul Somad",
      description: "Kajian subuh bersama Ustadz Abdul Somad dengan tema 'Meraih Ketenangan Jiwa dalam Islam'. Terbuka untuk umum, gratis, dan tidak perlu registrasi. Hadir lebih awal untuk mendapatkan tempat duduk yang baik.",
      location: "Lantai Utama Musholla Nurul Iman",
      startDate: "2026-04-10",
      endDate: "2026-04-10",
      imageUrl: "https://picsum.photos/seed/event1/800/500",
      isActive: true,
    },
    {
      title: "Peringatan Isra Mi'raj 1448 H",
      description: "Peringatan Isra Mi'raj Nabi Muhammad SAW 1448 H dengan ceramah dari ulama-ulama ternama, pembacaan sholawat, dan doa bersama. Acara dimulai pukul 19.30 WIB hingga selesai.",
      location: "Musholla Nurul Iman Jakarta",
      startDate: "2027-02-08",
      endDate: "2027-02-08",
      imageUrl: "https://picsum.photos/seed/event2/800/500",
      isActive: true,
    },
    {
      title: "Festival Kuliner Halal Nusantara 2026",
      description: "Festival kuliner halal terbesar yang menghadirkan ratusan UMKM makanan dan minuman halal dari seluruh Indonesia. Diramaikan dengan pertunjukan budaya, lomba memasak, dan pameran produk halal.",
      location: "Pelataran Musholla Nurul Iman",
      startDate: "2026-06-15",
      endDate: "2026-06-17",
      imageUrl: "https://picsum.photos/seed/event3/800/500",
      isActive: true,
    },
    {
      title: "Musabaqah Tilawatil Quran (MTQ) Tingkat DKI Jakarta",
      description: "MTQ tingkat provinsi DKI Jakarta yang mempertandingkan berbagai cabang tilawah, hafalan, dan tafsir Al-Quran. Diikuti oleh peserta dari seluruh wilayah DKI Jakarta.",
      location: "Aula Serbaguna Musholla Nurul Iman",
      startDate: "2026-05-20",
      endDate: "2026-05-23",
      imageUrl: "https://picsum.photos/seed/event4/800/500",
      isActive: true,
    },
    {
      title: "Seminar Nasional: Ekonomi Syariah di Era Digital",
      description: "Seminar nasional yang membahas perkembangan ekonomi syariah, fintech halal, dan UMKM berbasis syariah di Indonesia. Menghadirkan pembicara dari Bank Indonesia, OJK, dan pakar ekonomi syariah.",
      location: "Aula Musholla Nurul Iman",
      startDate: "2026-04-25",
      endDate: "2026-04-25",
      imageUrl: "https://picsum.photos/seed/event5/800/500",
      isActive: false,
    },
  ]);
  console.log("   ✅ Kegiatan berhasil dibuat\n");

  // ─── Gallery ──────────────────────────────────────────────────────────────────
  console.log("🖼️  Mengisi galeri...");
  await db.delete(galleryTable);
  await db.insert(galleryTable).values([
    { title: "Kubah Utama Musholla Nurul Iman", imageUrl: "https://picsum.photos/seed/gallery1/800/600", category: "Arsitektur", isActive: true },
    { title: "Ruang Sholat Utama", imageUrl: "https://picsum.photos/seed/gallery2/800/600", category: "Interior", isActive: true },
    { title: "Menara Musholla Nurul Iman", imageUrl: "https://picsum.photos/seed/gallery3/800/600", category: "Arsitektur", isActive: true },
    { title: "Jamaah Sholat Jumat", imageUrl: "https://picsum.photos/seed/gallery4/800/600", category: "Kegiatan", isActive: true },
    { title: "Taman Refleksi Istiqlal-Katedral", imageUrl: "https://picsum.photos/seed/gallery5/800/600", category: "Lingkungan", isActive: true },
    { title: "Kajian Ramadan 2025", imageUrl: "https://picsum.photos/seed/gallery6/800/600", category: "Kegiatan", isActive: true },
    { title: "Lorong dan Pilar Masjid", imageUrl: "https://picsum.photos/seed/gallery7/800/600", category: "Arsitektur", isActive: true },
    { title: "Area Wudhu Renovasi", imageUrl: "https://picsum.photos/seed/gallery8/800/600", category: "Interior", isActive: true },
    { title: "Sholat Idul Fitri 1447 H", imageUrl: "https://picsum.photos/seed/gallery9/800/600", category: "Kegiatan", isActive: true },
    { title: "Perpustakaan Musholla Nurul Iman", imageUrl: "https://picsum.photos/seed/gallery10/800/600", category: "Interior", isActive: true },
    { title: "Pintu Utama Masjid", imageUrl: "https://picsum.photos/seed/gallery11/800/600", category: "Arsitektur", isActive: true },
    { title: "Festival Kuliner Halal", imageUrl: "https://picsum.photos/seed/gallery12/800/600", category: "Kegiatan", isActive: false },
  ]);
  console.log("   ✅ Galeri berhasil diisi\n");

  // ─── Pages ────────────────────────────────────────────────────────────────────
  console.log("📄 Membuat halaman statis...");
  await db.delete(pagesTable);
  await db.insert(pagesTable).values([
    {
      title: "Profil Musholla Nurul Iman",
      slug: "profil",
      isPublished: true,
      content: `<h2>Sejarah Musholla Nurul Iman</h2>
<p>Musholla Nurul Iman adalah masjid negara Republik Indonesia yang terletak di pusat ibukota Jakarta. Masjid ini merupakan masjid terbesar di Asia Tenggara dan salah satu yang terbesar di dunia.</p>
<p>Istiqlal dalam bahasa Arab berarti kemerdekaan, yang mencerminkan semangat kemerdekaan Indonesia ketika masjid ini didirikan. Pembangunan masjid ini merupakan wujud rasa syukur bangsa Indonesia atas kemerdekaan yang dicapai pada tahun 1945.</p>
<h2>Arsitektur</h2>
<p>Musholla Nurul Iman dirancang oleh Friedrich Silaban, seorang arsitek berkebangsaan Indonesia. Desain masjid ini memadukan unsur modernisme dengan nilai-nilai Islam. Pembangunan dimulai pada tahun 1961 dan diresmikan oleh Presiden Soeharto pada tanggal 22 Februari 1978.</p>
<p>Kubah utama masjid berdiameter 45 meter yang melambangkan tahun kemerdekaan Indonesia. Menara tunggal setinggi 96,66 meter melambangkan tahun kelahiran Nabi Muhammad SAW, yaitu 570 M dalam penanggalan masehi (dibulatkan).</p>
<h2>Kapasitas dan Fasilitas</h2>
<p>Musholla Nurul Iman mampu menampung hingga 200.000 jamaah sekaligus, menjadikannya salah satu masjid dengan kapasitas terbesar di dunia. Fasilitas yang tersedia antara lain:</p>
<ul>
<li>Ruang sholat utama berlantai lima</li>
<li>Museum dan perpustakaan Islam</li>
<li>Kantor administrasi dan pelayanan jamaah</li>
<li>Area parkir yang luas</li>
<li>Taman refleksi bersama Katedral Jakarta</li>
</ul>`,
    },
    {
      title: "Museum Istiqlal",
      slug: "museum-istiqlal",
      isPublished: true,
      content: `<h2>Museum Musholla Nurul Iman</h2>
<p>Museum Musholla Nurul Iman menyimpan berbagai koleksi bersejarah yang berkaitan dengan pembangunan dan perkembangan Musholla Nurul Iman dari masa ke masa. Museum ini menjadi salah satu destinasi wisata edukasi yang wajib dikunjungi bagi siapa saja yang datang ke Musholla Nurul Iman.</p>
<h2>Koleksi Museum</h2>
<p>Koleksi museum mencakup:</p>
<ul>
<li>Dokumen dan foto pembangunan masjid dari era Presiden Soekarno</li>
<li>Maket asli rancangan Friedrich Silaban</li>
<li>Koleksi Al-Quran langka dan bersejarah</li>
<li>Peralatan dan ornamen masjid dari berbagai era</li>
<li>Diorama perjalanan sejarah Musholla Nurul Iman</li>
</ul>
<h2>Jam Operasional</h2>
<p>Museum buka setiap hari kecuali waktu sholat fardhu:<br>
Senin–Jumat: 09.00–16.00 WIB<br>
Sabtu–Ahad: 08.00–17.00 WIB</p>
<p>Kunjungan gratis untuk umum. Pemandu wisata tersedia untuk kunjungan grup dengan reservasi terlebih dahulu.</p>`,
    },
    {
      title: "Kontak Kami",
      slug: "kontak",
      isPublished: true,
      content: `<h2>Hubungi Kami</h2>
<p>Untuk informasi lebih lanjut tentang Musholla Nurul Iman, layanan, dan kegiatan kami, silakan hubungi kami melalui:</p>
<h3>Alamat</h3>
<p>Jl. Taman Wijaya Kusuma, Ps. Baru, Kec. Sawah Besar,<br>
Kota Jakarta Pusat, DKI Jakarta 10710</p>
<h3>Telepon</h3>
<p>(021) 345-1523</p>
<h3>Email</h3>
<p>info@istiqlal.or.id</p>
<h3>Jam Pelayanan Administrasi</h3>
<p>Senin – Jumat: 08.00 – 16.00 WIB<br>
Sabtu: 08.00 – 12.00 WIB<br>
Ahad & Hari Besar: Tutup</p>`,
    },
    {
      title: "Panduan Berkunjung",
      slug: "panduan-berkunjung",
      isPublished: true,
      content: `<h2>Informasi Kunjungan</h2>
<p>Musholla Nurul Iman terbuka untuk umum setiap hari. Berikut panduan untuk pengunjung yang ingin berziarah atau beribadah di Musholla Nurul Iman.</p>

<h3>Jam Operasional</h3>
<ul>
  <li><strong>Senin – Minggu:</strong> 04.00 – 22.00 WIB</li>
  <li>Masjid tutup sementara saat pelaksanaan shalat fardhu (±30 menit)</li>
</ul>

<h3>Aturan Berpakaian</h3>
<ul>
  <li>Wajib berpakaian sopan dan menutup aurat</li>
  <li>Bagi wanita, disediakan jilbab di pintu masuk (gratis)</li>
  <li>Sandal/sepatu dititipkan di penitipan yang tersedia</li>
</ul>

<h3>Lokasi &amp; Akses</h3>
<p>Jl. Taman Wijaya Kusuma, Ps. Baru, Kecamatan Sawah Besar, Jakarta Pusat</p>
<ul>
  <li><strong>MRT:</strong> Stasiun Lebak Bulus → Bundaran HI, lalu naik bus ke Monas</li>
  <li><strong>KRL:</strong> Stasiun Juanda (jarak ±500m berjalan kaki)</li>
  <li><strong>Parkir:</strong> Tersedia di Gedung Parkir Istiqlal</li>
</ul>

<h3>Fasilitas</h3>
<ul>
  <li>Tempat wudhu pria dan wanita</li>
  <li>Area shalat kapasitas 200.000 jamaah</li>
  <li>Museum Istiqlal</li>
  <li>Pusat informasi wisata religi</li>
  <li>Toilet &amp; fasilitas disabilitas</li>
</ul>`,
    },
    {
      title: "Aplikasi",
      slug: "aplikasi",
      isPublished: true,
      content: `<h2>Link Aplikasi Di Bawah</h2>`,
      websiteUrls: JSON.stringify([{ label: "Aplikasi Penerimaan Hewan Qurban Dengan QRCODE & RFID", url: "https://dashboard.ngrok.com/login" }]),
    },
  ]);
  console.log("   ✅ Halaman berhasil dibuat\n");

  // ─── CCTV Cameras ─────────────────────────────────────────────────────────────
  console.log("📷 Mengisi data CCTV...");
  await db.delete(cctvTable);
  await db.insert(cctvTable).values([
    {
      name: "Ruang Sholat Utama",
      location: "Lantai 1 – Ruang Sholat Utama",
      streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCYfCbGfC8PGKuFMcj7iW7xw",
      embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCYfCbGfC8PGKuFMcj7iW7xw",
      isActive: true,
      order: 1,
      description: "Live streaming ruang sholat utama Musholla Nurul Iman",
    },
    {
      name: "Halaman Depan Masjid",
      location: "Pintu Utama – Halaman Depan",
      streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCYfCbGfC8PGKuFMcj7iW7xw&v=2",
      embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCYfCbGfC8PGKuFMcj7iW7xw&v=2",
      isActive: true,
      order: 2,
      description: "Pemantauan area halaman depan dan pintu utama masjid",
    },
    {
      name: "Area Parkir Utara",
      location: "Parkir Utara",
      streamUrl: "https://www.youtube.com/embed/live_stream?channel=example&v=3",
      embedUrl: "https://www.youtube.com/embed/live_stream?channel=example&v=3",
      isActive: false,
      order: 3,
      description: "Pemantauan area parkir sisi utara",
    },
  ]);
  console.log("   ✅ CCTV berhasil diisi\n");

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ Seed database selesai!");
  console.log("");
  console.log("📋 Kredensial Admin:");
  console.log("   Username : admin");
  console.log("   Password : istiqlal2024");
  console.log("═══════════════════════════════════════════════════════");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed gagal:", err);
  process.exit(1);
});
