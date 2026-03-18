import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FinAgent — AI Financial Analyst',
  description: 'Real-time stock analysis powered by LLaMA 3 and live market data',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
