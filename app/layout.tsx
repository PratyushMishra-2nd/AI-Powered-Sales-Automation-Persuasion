import type { Metadata } from 'next'
import { Chakra_Petch, JetBrains_Mono } from 'next/font/google'
import { AppProvider } from '@/context/AppContext'
import Toast from '@/components/ui/Toast'
import './globals.css'

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'OutreachAI — Sales Command Center',
  description: 'AI-powered sales automation suite',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chakraPetch.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AppProvider>
          {children}
          <Toast />
        </AppProvider>
      </body>
    </html>
  )
}
