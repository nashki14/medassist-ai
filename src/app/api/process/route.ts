import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { notes, specialty } = await req.json()

    if (!notes || notes.trim().length < 10) {
      return NextResponse.json({ error: 'Catatan terlalu pendek.' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key tidak ditemukan.' }, { status: 500 })
    }

    const specialtyMap: Record<string, string> = {
      umum: 'Poli Umum / General Practice',
      igd: 'IGD / Emergency Medicine',
      anak: 'Poli Anak / Pediatrics',
      interna: 'Penyakit Dalam / Internal Medicine',
      bedah: 'Bedah Umum / General Surgery',
      kandungan: 'Kandungan / Obstetrics & Gynecology',
    }

    const specialtyLabel = specialtyMap[specialty] || 'Poli Umum'

    const systemPrompt = `Kamu adalah asisten AI medis untuk klinik Indonesia. Spesialisasi: ${specialtyLabel}.

Analisis catatan medis dan hasilkan HANYA JSON valid (tanpa markdown, tanpa teks lain):
{
  "soap": {
    "subjective": "keluhan, riwayat penyakit, riwayat pengobatan",
    "objective": "tanda vital, pemeriksaan fisik, hasil penunjang",
    "assessment": "diagnosis kerja dan banding",
    "plan": "tatalaksana, obat, edukasi, follow up"
  },
  "summary": "ringkasan klinis 2-3 kalimat",
  "diagnoses": ["diagnosis1", "diagnosis2"],
  "icd": [
    {"code": "X00", "label": "nama diagnosis", "description": "keterangan", "confidence": 0.92}
  ],
  "flags": ["peringatan klinis jika ada"],
  "vitals": {"td": "...", "nadi": "...", "rr": "...", "suhu": "...", "spo2": "..."}
}
Bahasa Indonesia baku. Data tidak ada tulis "Tidak disebutkan".`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 50000)

    let response
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://medassist-ai-pi.vercel.app',
          'X-Title': 'MedAssist AI',
        },
        body: JSON.stringify({
          model: 'google/gemma-3-27b-it:free',
          max_tokens: 1200,
          temperature: 0.1,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nCatatan medis:\n${notes}` },
          ],
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenRouter error:', response.status, errText)
      return NextResponse.json(
        { error: `AI error ${response.status}. Coba lagi.` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const rawText = data.choices?.[0]?.message?.content || ''

    let parsed
    try {
      const clean = rawText.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('JSON parse error. Raw:', rawText.slice(0, 300))
      return NextResponse.json(
        { error: 'Format respons AI tidak valid. Coba lagi.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ result: parsed })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'AI timeout. Coba lagi.' }, { status: 504 })
    }
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}