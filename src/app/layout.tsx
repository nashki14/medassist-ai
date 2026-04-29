import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MedAssist AI — Medical Note Engine',
  description: 'AI-powered medical note summarizer for clinics and healthcare professionals. Auto-generate SOAP notes, clinical summaries, and ICD-10 codes from raw doctor notes.',
  keywords: 'medical note, SOAP note, ICD-10, AI klinik, rekam medis, dokter',
  openGraph: {
    title: 'MedAssist AI',
    description: 'Turn messy clinical notes into structured SOAP documentation in seconds.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
