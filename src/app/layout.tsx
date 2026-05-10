import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Download',
  description: 'Complete a quick task to access your download.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
