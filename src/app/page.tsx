'use client'

import { useState, useRef } from 'react'
import {
  Stethoscope, Zap, FileText, Activity, BookOpen,
  AlertTriangle, Copy, Check, Trash2, ChevronDown,
  Clock, Shield, Download
} from 'lucide-react'

const DEMO_NOTES = {
  ht: `ps dtg ke poli jam 9 pg, laki2 43th, keluhan sakit kepala sejak 3hr yll, lebih berat di belakang kepala, ada riwayat HT tapi minum obat ga teratur, TD 160/100, nadi 88, rr 20, suhu 36.8. Pasien juga ngeluh agak mual tp ga muntah. Fisik: kepala NT+, leher kaku(-), ekstremitas normal. Kesan: HT tidak terkontrol.`,
  dm: `Pasien wanita 58 thn dtg kontrol DM, keluhan sering kencing malam >4x, BB turun 3kg dlm 1 bln, GDP terakhir 280, gdp2pp 340. riwayat DM tipe 2 sejak 10 thn lalu. OAD metformin 500 2x1 tapi sering lupa. TD 130/85, BB 62 IMT 24.5. A1C belum cek 6bln terakhir.`,
  ispa: `Anak 5th 20kg dibawa ibunya, demam sejak 2hr yll 38.5, batuk berdahak warna putih kekuningan, pilek, tdk mau makan. Tidak ada sesak. PF: faring hiperemis, tonsil T1-T1, rhonki (-), wheezing (-). riwayat alergi (-).`,
  gea: `Pasien laki 28th, datang dgn keluhan mencret sejak kemarin pagi sudah 6x cair ada ampas sedikit, mual muntah 3x, kram perut, demam ringan 37.8. Makan diluar 2hr yll. PF: turgor kulit agak lambat, mucosa kering, NT epigastrik (+). TD 100/70, Nadi 98.`,
}

const SPECIALTIES = [
  { value: 'umum', label: 'Poli Umum' },
  { value: 'igd', label: 'IGD / Gawat Darurat' },
  { value: 'anak', label: 'Poli Anak' },
  { value: 'interna', label: 'Penyakit Dalam' },
  { value: 'bedah', label: 'Bedah Umum' },
  { value: 'kandungan', label: 'Kandungan / Obgyn' },
]

type Tab = 'soap' | 'summary' | 'icd'

interface SOAPResult {
  soap: { subjective: string; objective: string; assessment: string; plan: string }
  summary: string
  diagnoses: string[]
  icd: { code: string; label: string; description: string; confidence: number }[]
  flags: string[]
  vitals: { td: string; nadi: string; rr: string; suhu: string; spo2: string }
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-teal dot-1" />
      <div className="w-2 h-2 rounded-full bg-teal dot-2" />
      <div className="w-2 h-2 rounded-full bg-teal dot-3" />
    </div>
  )
}

function SOAPCard({ letter, label, content, color }: { letter: string; label: string; content: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden fade-in">
      <div className={`flex items-center gap-3 px-4 py-3 ${color}`}>
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">
          {letter}
        </div>
        <span className="text-sm font-semibold tracking-wide uppercase">{label}</span>
      </div>
      <div className="px-4 py-3 bg-white/5 text-sm text-teal-pale leading-relaxed">
        {content || <span className="text-white/30 italic">Tidak disebutkan</span>}
      </div>
    </div>
  )
}

export default function MedAssistApp() {
  const [notes, setNotes] = useState('')
  const [specialty, setSpecialty] = useState('umum')
  const [activeTab, setActiveTab] = useState<Tab>('soap')
  const [result, setResult] = useState<SOAPResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [processedAt, setProcessedAt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleProcess() {
    if (!notes.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, specialty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memproses')
      setResult(data.result)
      setProcessedAt(new Date().toLocaleTimeString('id-ID'))
      setActiveTab('soap')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    const text = `SOAP NOTE — MedAssist AI\n\nS: ${result.soap.subjective}\nO: ${result.soap.objective}\nA: ${result.soap.assessment}\nP: ${result.soap.plan}\n\nRINGKASAN:\n${result.summary}\n\nDIAGNOSIS: ${result.diagnoses.join(', ')}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!result) return
    const content = `SOAP NOTE — MedAssist AI\nDiproses: ${processedAt}\n\n${'='.repeat(50)}\n\nSUBJECTIVE:\n${result.soap.subjective}\n\nOBJECTIVE:\n${result.soap.objective}\n\nASSESSMENT:\n${result.soap.assessment}\n\nPLAN:\n${result.soap.plan}\n\n${'='.repeat(50)}\n\nRINGKASAN KLINIS:\n${result.summary}\n\nDIAGNOSIS UTAMA:\n${result.diagnoses.map(d => `• ${d}`).join('\n')}\n\nKODE ICD-10:\n${result.icd.map(i => `• ${i.code} — ${i.label} (${Math.round(i.confidence * 100)}%)`).join('\n')}\n\n* Dihasilkan oleh MedAssist AI. Verifikasi oleh tenaga medis berwenang tetap diperlukan.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `soap-note-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'soap', label: 'SOAP Note', icon: <FileText size={14} /> },
    { id: 'summary', label: 'Ringkasan', icon: <Activity size={14} /> },
    { id: 'icd', label: 'ICD-10', icon: <BookOpen size={14} /> },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A1628' }}>

      {/* HEADER */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0F6E56' }}>
              <Stethoscope size={18} color="#E1F5EE" />
            </div>
            <div>
              <div className="font-serif font-bold text-lg" style={{ color: '#E1F5EE' }}>MedAssist AI</div>
              <div className="text-xs" style={{ color: '#5DCAA5' }}>Medical Note Engine</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: '#5DCAA5' }}>
            <div className="hidden sm:flex items-center gap-1.5">
              <Shield size={12} />
              <span>Data tidak disimpan</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Zap size={12} />
              <span>Powered by OpenRouter</span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="border-b border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#E1F5EE' }}>
            Catatan Medis Berantakan?
          </h1>
          <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: '#5DCAA5' }}>
            Paste catatan dokter/perawat → AI otomatis rapikan, buat SOAP note, ringkasan klinis, dan rekomendasi kode ICD-10.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

          {/* LEFT — INPUT */}
          <div className="flex flex-col gap-4">

            {/* Specialty + Demo */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs" style={{ color: '#5DCAA5' }}>
                <span>Spesialisasi:</span>
                <div className="relative">
                  <select
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs border border-white/20 bg-white/10 cursor-pointer"
                    style={{ color: '#E1F5EE' }}
                  >
                    {SPECIALTIES.map(s => (
                      <option key={s.value} value={s.value} style={{ background: '#0A1628' }}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5DCAA5' }} />
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs" style={{ color: '#5DCAA5', opacity: 0.6 }}>Coba contoh:</span>
                {Object.entries({ ht: 'Hipertensi', dm: 'Diabetes', ispa: 'ISPA Anak', gea: 'GEA' }).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setNotes(DEMO_NOTES[key as keyof typeof DEMO_NOTES])}
                    className="text-xs px-2.5 py-1 rounded-full border border-white/20 hover:border-white/40 transition-colors"
                    style={{ color: '#5DCAA5' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 flex flex-col rounded-2xl border border-white/15 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                <span className="text-xs font-medium" style={{ color: '#5DCAA5' }}>Catatan Mentah</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{notes.length} karakter</span>
              </div>
              <textarea
                ref={textareaRef}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 text-sm leading-relaxed outline-none scrollbar-thin min-h-64 lg:min-h-80"
                style={{ color: '#E1F5EE', fontFamily: 'monospace' }}
                placeholder={`Paste catatan medis di sini...\n\nContoh: ps dtg ke poli jam 9, laki2 43th, keluhan sakit kepala 3hr, riwayat HT tidak terkontrol, TD 160/100...`}
              />
              <div className="px-4 py-3 border-t border-white/10 flex justify-between items-center gap-3">
                <button
                  onClick={() => { setNotes(''); setResult(null); setError('') }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  <Trash2 size={12} />
                  Bersihkan
                </button>
                <button
                  onClick={handleProcess}
                  disabled={loading || !notes.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#1D9E75', color: '#E1F5EE' }}
                >
                  {loading ? (
                    <>
                      <LoadingDots />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      <span>Proses dengan AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — OUTPUT */}
          <div className="flex flex-col rounded-2xl border border-white/15 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={!result}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-teal-DEFAULT'
                      : 'border-transparent'
                  } disabled:opacity-40`}
                  style={{
                    color: activeTab === tab.id ? '#1D9E75' : 'rgba(255,255,255,0.4)',
                    borderColor: activeTab === tab.id ? '#1D9E75' : 'transparent',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}

              {result && (
                <div className="ml-auto flex items-center gap-1 px-3">
                  <button
                    onClick={handleCopy}
                    title="Copy SOAP"
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: '#5DCAA5' }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={handleDownload}
                    title="Download TXT"
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: '#5DCAA5' }}
                  >
                    <Download size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Output body */}
            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin min-h-64 lg:min-h-80">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm" style={{ color: '#f87171' }}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <LoadingDots />
                  <p className="text-xs" style={{ color: '#5DCAA5' }}>AI sedang menganalisis catatan medis...</p>
                </div>
              )}

              {!loading && !result && !error && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)' }}>
                    <Stethoscope size={24} style={{ color: '#1D9E75' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#E1F5EE' }}>Belum ada catatan diproses</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Paste catatan medis & klik "Proses dengan AI"</p>
                  </div>
                </div>
              )}

              {result && !loading && (
                <div className="flex flex-col gap-3">
                  {/* Vitals quick row */}
                  {result.vitals && Object.values(result.vitals).some(v => v && v !== 'Tidak disebutkan') && (
                    <div className="flex flex-wrap gap-2 pb-3 border-b border-white/10">
                      {[
                        { key: 'td', label: 'TD' },
                        { key: 'nadi', label: 'Nadi' },
                        { key: 'rr', label: 'RR' },
                        { key: 'suhu', label: 'Suhu' },
                        { key: 'spo2', label: 'SpO2' },
                      ].filter(v => result.vitals[v.key as keyof typeof result.vitals] && result.vitals[v.key as keyof typeof result.vitals] !== 'Tidak disebutkan').map(v => (
                        <div key={v.key} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(29,158,117,0.15)', color: '#5DCAA5', border: '1px solid rgba(29,158,117,0.25)' }}>
                          <span style={{ opacity: 0.7 }}>{v.label}:</span>
                          <span className="font-medium">{result.vitals[v.key as keyof typeof result.vitals]}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Flags */}
                  {result.flags && result.flags.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                      <div className="flex flex-col gap-1">
                        {result.flags.map((flag, i) => (
                          <p key={i} className="text-xs" style={{ color: '#fbbf24' }}>{flag}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SOAP Tab */}
                  {activeTab === 'soap' && (
                    <div className="flex flex-col gap-3">
                      <SOAPCard letter="S" label="Subjective" content={result.soap.subjective} color="text-blue-300 bg-blue-900/30" />
                      <SOAPCard letter="O" label="Objective" content={result.soap.objective} color="text-teal-300 bg-teal-900/30" />
                      <SOAPCard letter="A" label="Assessment" content={result.soap.assessment} color="text-amber-300 bg-amber-900/30" />
                      <SOAPCard letter="P" label="Plan" content={result.soap.plan} color="text-pink-300 bg-pink-900/30" />
                    </div>
                  )}

                  {/* Summary Tab */}
                  {activeTab === 'summary' && (
                    <div className="flex flex-col gap-4 fade-in">
                      <div>
                        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Ringkasan Klinis</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#E1F5EE' }}>{result.summary}</p>
                      </div>
                      {result.diagnoses && result.diagnoses.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Diagnosis Utama</p>
                          <div className="flex flex-wrap gap-2">
                            {result.diagnoses.map((d, i) => (
                              <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(29,158,117,0.2)', color: '#5DCAA5', border: '1px solid rgba(29,158,117,0.3)' }}>
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ICD Tab */}
                  {activeTab === 'icd' && (
                    <div className="flex flex-col gap-2 fade-in">
                      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Rekomendasi Kode ICD-10</p>
                      {result.icd.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="font-mono text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(29,158,117,0.2)', color: '#5DCAA5' }}>
                            {item.code}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#E1F5EE' }}>{item.label}</p>
                            {item.description && (
                              <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.description}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <div className="text-xs px-2 py-1 rounded-full font-medium" style={{
                              background: item.confidence > 0.8 ? 'rgba(29,158,117,0.2)' : 'rgba(251,191,36,0.15)',
                              color: item.confidence > 0.8 ? '#5DCAA5' : '#fbbf24',
                            }}>
                              {Math.round(item.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        * Kode bersifat rekomendasi. Verifikasi oleh koder medis tetap diperlukan.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status bar */}
            {(result || loading) && (
              <div className="px-4 py-2 border-t border-white/10 flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 dot-1" />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Memproses...</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1D9E75' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <Clock size={10} className="inline mr-1" />
                      Diproses {processedAt}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <span>© 2025 MedAssist AI — Bukan pengganti diagnosis dokter</span>
          <span>Next.js · Tailwind · OpenRouter · Vercel</span>
        </div>
      </footer>
    </div>
  )
}
