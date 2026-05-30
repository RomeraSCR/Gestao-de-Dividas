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
  title: 'FinanzLivre - Gestão Financeira Pessoal 100% Grátis',
  description: 'Sistema de gestão financeira pessoal e controle de gastos totalmente gratuito. Controle suas receitas, poupança, despesas e compras parceladas.',
  keywords: ['gestão financeira', 'controle financeiro', 'finanças pessoais', 'grátis', 'controle de gastos', 'dívidas', 'parcelas'],
  authors: [{ name: 'FinanzLivre' }],
  creator: 'FinanzLivre',
  publisher: 'FinanzLivre',
  icons: {
    icon: '/logo_circular.png',
    apple: '/logo_circular.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'FinanzLivre',
    title: 'FinanzLivre - Gestão Financeira Pessoal 100% Grátis',
    description: 'Sistema de gestão financeira pessoal e controle de gastos totalmente gratuito. Controle suas receitas, poupança, despesas e compras parceladas.',
    images: [
      {
        url: `${siteUrl}/opengraph-image.svg`,
        width: 1200,
        height: 630,
        alt: 'FinanzLivre',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinanzLivre - Gestão Financeira Pessoal 100% Grátis',
    description: 'Sistema de gestão financeira pessoal e controle de gastos totalmente gratuito. Controle suas receitas, poupança, despesas e compras parceladas.',
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
