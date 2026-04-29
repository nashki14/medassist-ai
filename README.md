# MedAssist AI — Medical Note Engine

> AI-powered medical note summarizer untuk klinik, dokter, dan tenaga kesehatan Indonesia.

![MedAssist AI](https://img.shields.io/badge/Stack-Next.js%20%7C%20Tailwind%20%7C%20OpenRouter-1D9E75?style=flat-square)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square)

## Apa ini?

MedAssist AI mengubah catatan medis berantakan menjadi dokumentasi klinis terstruktur dalam hitungan detik:

- **SOAP Note** otomatis (Subjective, Objective, Assessment, Plan)
- **Ringkasan Klinis** yang baku dan mudah dibaca
- **Highlight Diagnosis** utama
- **Rekomendasi ICD-10** dengan confidence score
- **Clinical Flags** untuk tanda bahaya yang perlu perhatian

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| AI Engine | OpenRouter API (Claude 3.5 Sonnet) |
| Deploy | Vercel |

## Cara Jalankan Lokal

```bash
# 1. Clone repo
git clone https://github.com/username/medassist-ai
cd medassist-ai

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local → masukkan OPENROUTER_API_KEY kamu

# 4. Jalankan dev server
npm run dev
```

Buka http://localhost:3000

## Deploy ke Vercel

1. Push ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Tambahkan Environment Variable: `OPENROUTER_API_KEY`
4. Deploy!

## Environment Variables

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

Daftar API key gratis di [openrouter.ai](https://openrouter.ai)

## Catatan Penting

> MedAssist AI adalah alat bantu dokumentasi, **bukan pengganti diagnosis dokter**. Output AI harus selalu diverifikasi oleh tenaga medis berwenang.

---

Built for wealthypeople.id Stage 2 Challenge · 2025
