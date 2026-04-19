import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
})

export const metadata: Metadata = {
  title: 'キッズミール - 子供の食事管理',
  description: '子供の成長に特化した食事・栄養管理アプリ',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <head>
        {/* ダークモードのちらつき防止：Reactより先に実行 */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('theme') || 'system';
            var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (d) document.documentElement.classList.add('dark');
          } catch(e) {}
        `}} />
      </head>
      <body className="bg-gray-100 dark:bg-slate-950 text-gray-900 font-sans antialiased">
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
