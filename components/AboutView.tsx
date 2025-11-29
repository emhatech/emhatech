
import React from 'react';
import { FilmIcon } from './Icons';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mt-8">
        <h2 className="text-2xl font-semibold text-cyan-700 dark:text-cyan-400 border-b border-slate-300 dark:border-slate-600 pb-2 mb-4">
            {title}
        </h2>
        {children}
    </section>
);

const ListItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <li className="mt-2">
        <strong className="text-slate-800 dark:text-slate-200">{title}:</strong>
        <span className="text-slate-600 dark:text-slate-400"> {children}</span>
    </li>
);

export const AboutView: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in transition-colors duration-300 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
            <div className="bg-cyan-600 p-3 rounded-lg mr-4 shadow-md">
                <FilmIcon className="h-8 w-8 text-white" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Tentang EMHATECH AI GENERATOR
                </h1>
                <p className="text-cyan-700 dark:text-cyan-400 mt-1">
                    Pusat kreatif lengkap untuk mewujudkan visi Anda.
                </p>
            </div>
        </div>
        
        <div className="text-slate-700 dark:text-slate-300 space-y-4">
             <p>
                Alat ini adalah asisten kreatif serbaguna yang dirancang untuk mengubah ide sederhana menjadi konten multimedia yang kaya dan menarik. Mulai dari cerita tertulis hingga video sinematik dan konten UGC (User-Generated Content) untuk media sosial, semua bisa dibuat di sini.
            </p>
            <p>
                Berikut adalah fitur-fitur utama yang dibagi berdasarkan modul utama:
            </p>

            <Section title="1. Generator Cerita">
                <p className="text-slate-600 dark:text-slate-400">
                    Ini adalah titik awal perjalanan kreatif Anda, tempat ide-ide dibentuk dan cerita dikembangkan.
                </p>
                <ul className="list-disc space-y-2 pl-5 mt-4">
                    <ListItem title="Ideasi Cerdas">Dapatkan puluhan ide cerita berdasarkan genre pilihan Anda. Saat Anda mulai menulis, AI akan secara dinamis memberikan ide-ide baru yang relevan dengan alur cerita Anda.</ListItem>
                    <ListItem title="Pembuatan Karakter Fleksibel">Tentukan karakter utama Anda dengan deskripsi teks atau dengan mengunggah gambar untuk konsistensi visual.</ListItem>
                    <ListItem title="Pengembangan Cerita Otomatis">Ubah poin-poin plot atau draf kasar Anda menjadi sebuah cerita lengkap dengan narasi yang kaya.</ListItem>
                    <ListItem title="Polesan Tulisan Profesional">Dengan satu klik, AI akan menyempurnakan tulisan Anda, meningkatkan pilihan kata, alur, dan dampak emosional.</ListItem>
                    <ListItem title="Kontrol Aspek Rasio">Pilih mode gambar antara Landscape (16:9) untuk tampilan sinematik atau Portrait (9:16) yang sempurna untuk platform mobile.</ListItem>
                </ul>
            </Section>

            <Section title="2. UGC IMG & PROMPT">
                <p className="text-slate-600 dark:text-slate-400">
                    Modul ini dirancang khusus untuk membuat konten video pendek bergaya User-Generated Content (UGC) yang cocok untuk platform seperti TikTok atau Instagram Reels.
                </p>
                <ul className="list-disc space-y-2 pl-5 mt-4">
                    <ListItem title="Input Ganda (Karakter & Produk)">Unggah gambar model/karakter Anda dan gambar produk untuk membuat konten promosi yang relevan.</ListItem>
                    <ListItem title="Paket Konten Lengkap">Secara otomatis menghasilkan 6 gambar Portrait (9:16) dan 6 prompt video JSON yang menyertainya.</ListItem>
                    <ListItem title="Skrip Siap Pakai (Voice Over Only)">JSON berisi deskripsi adegan dan skrip sulih suara yang singkat dan jelas. Fitur ini dirancang untuk fokus pada narasi suara tanpa teks overlay, musik, atau efek suara, menghasilkan video yang bersih. Setiap adegan dirancang untuk durasi sekitar 8 detik.</ListItem>
                    <ListItem title="Dukungan Multi-Bahasa">Buat skrip video dalam berbagai bahasa, termasuk Indonesia, Inggris, Jepang, Korea, Spanyol, Malaysia, dan India.</ListItem>
                    <ListItem title="Unduhan Kustom">Semua gambar yang dihasilkan dapat diunduh dalam satu file ZIP bernama <code>terimakasi-emhatech-ganteng.zip</code>.</ListItem>
                </ul>
            </Section>

            <Section title="3. Lirik Musik (Baru)">
                <p className="text-slate-600 dark:text-slate-400">
                   Alat analisis musik cerdas untuk mendapatkan lirik yang akurat, terstruktur, dan siap pakai.
                </p>
                <ul className="list-disc space-y-2 pl-5 mt-4">
                    <ListItem title="Pencarian Lirik Global">Menggunakan kecerdasan Google Search untuk menemukan lirik lagu dari seluruh dunia (Indonesia, Barat, K-Pop, J-Pop, dll) secara akurat.</ListItem>
                    <ListItem title="Format Suno AI Ready">Lirik otomatis diformat dengan tag struktur ([Verse], [Chorus]) tanpa kunci gitar, siap untuk langsung digunakan di platform Suno AI.</ListItem>
                    <ListItem title="Analisis & Edit">Memungkinkan Anda memverifikasi dan mengedit lirik asli sebelum melakukan proses terjemahan.</ListItem>
                    <ListItem title="Terjemahan Sinkron">Menerjemahkan lirik baris-demi-baris secara presisi tanpa merusak struktur lagu, memudahkan pemahaman makna.</ListItem>
                </ul>
            </Section>

            <Section title="4. Buku Cerita">
                <p className="text-slate-600 dark:text-slate-400">
                    Di sinilah cerita Anda menjadi hidup dalam bentuk visual dan audio.
                </p>
                <ul className="list-disc space-y-2 pl-5 mt-4">
                    <ListItem title="Visualisasi Cerita">Lihat cerita lengkap Anda berdampingan dengan ilustrasi sinematik yang dibuat oleh AI berdasarkan adegan-adegan kunci.</ListItem>
                    <ListItem title="Narasi Audio (Text-to-Speech)">Ubah teks cerita Anda menjadi narasi audio berkualitas tinggi yang dapat diunduh dalam format <code>.wav</code>.</ListItem>
                    <ListItem title="Manajemen Aset">Regenerasi gambar yang kurang pas dengan satu klik dan unduh semua ilustrasi dalam satu file ZIP yang praktis.</ListItem>
                </ul>
            </Section>

             <Section title="5. Fitur Lainnya">
                <ul className="list-disc space-y-2 pl-5 mt-4">
                    <ListItem title="Manajemen Kunci API">Dukungan untuk menggunakan kunci API pribadi Anda untuk menghindari batasan kuota sistem.</ListItem>
                </ul>
            </Section>
        </div>
    </div>
  );
};
