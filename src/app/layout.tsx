import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const globalFontInter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OmniModel | The Universal ML Converter',
  description: 'Instantly convert your Machine Learning models across architectures securely.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={globalFontInter.className}>{children}</body>
    </html>
  )
}
