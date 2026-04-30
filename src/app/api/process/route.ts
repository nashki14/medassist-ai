import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30
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

    const systemPrompt = `Kamu adalah asisten AI medis senior untuk klinik di Indonesia, dengan keahlian dalam dokumentasi klinis.

Spesialisasi aktif: ${specialtyLabel}

Tugasmu: Analisis catatan medis mentah dan hasilkan output JSON terstruktur yang komprehensif.

Aturan penting:
- Gunakan bahasa Indonesia yang baku dan klinis
- SOAP note harus lengkap, detail, dan sesuai standar rekam medis Indonesia
- ICD-10 harus akurat dan relevan dengan temuan klinis
- Jika ada informasi yang tidak disebutkan, tulis "Tidak disebutkan" atau "Perlu dikaji lebih lanjut"
- Confidence ICD antara 0.6 - 0.99 berdasarkan kekuatan bukti klinis

Hasilkan HANYA JSON valid tanpa markdown, tanpa preamble, dengan struktur PERSIS ini:
{
  "soap": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "summary": "...",
  "diagnoses": ["diagnosis1", "diagnosis2"],
  "icd": [
    {"code": "X00", "label": "...", "description": "...", "confidence": 0.92},
    {"code": "X00.0", "label": "...", "description": "...", "confidence": 0.75}
  ],
  "flags": ["flag1", "flag2"],
  "vitals": {
    "td": "...",
    "nadi": "...",
    "rr": "...",
    "suhu": "...",
    "spo2": "..."
  }
}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://medassist-ai.vercel.app',
        'X-Title': 'MedAssist AI',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 1500,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analisis catatan medis berikut:\n\n${notes}` },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenRouter error:', errText)
      return NextResponse.json({ error: 'Gagal menghubungi AI. Coba lagi.' }, { status: 502 })
    }

    const data = await response.json()
    const rawText = data.choices?.[0]?.message?.content || ''

    let parsed
    try {
      const clean = rawText.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('JSON parse error:', rawText)
      return NextResponse.json({ error: 'Format respons AI tidak valid. Coba lagi.' }, { status: 422 })
    }

    return NextResponse.json({ result: parsed })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
