import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ensureInitialized } from '@/lib/db'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { PwaRegister } from '@/components/pwa-register'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dividas.neonproject.cloud'

export const metadata: Metadata = {
  title: 'Gestão de Dívidas',
  description: 'Sistema de gestão de dívidas e compras parceladas. Controle total das suas compras parceladas.',
  keywords: ['gestão de dívidas', 'compras parceladas', 'controle financeiro', 'dívidas', 'parcelas'],
  authors: [{ name: 'Gestão de Dívidas' }],
  creator: 'Gestão de Dívidas',
  publisher: 'Gestão de Dívidas',
  icons: {
    icon: '/logo_circular.svg',
    apple: '/logo_circular.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Gestão de Dívidas',
    title: 'Gestão de Dívidas - Controle total das suas compras parceladas',
    description: 'Sistema de gestão de dívidas e compras parceladas. Saiba exatamente o que foi comprado, quanto falta pagar e acompanhe o progresso dos pagamentos.',
    images: [
      {
        url: `${siteUrl}/opengraph-image.svg`,
        width: 1200,
        height: 630,
        alt: 'Gestão de Dívidas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestão de Dívidas - Controle total das suas compras parceladas',
    description: 'Sistema de gestão de dívidas e compras parceladas. Saiba exatamente o que foi comprado, quanto falta pagar e acompanhe o progresso dos pagamentos.',
    images: [`${siteUrl}/opengraph-image.svg`],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL(siteUrl),
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Inicializar banco de dados na primeira requisição
  await ensureInitialized()

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster position="top-center" richColors />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  )
}
