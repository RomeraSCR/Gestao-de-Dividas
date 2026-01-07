import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import {
  Wallet,
  Users,
  TrendingDown,
  Shield,
  Github,
  ArrowRight,
  Sparkles,
  CalendarCheck2,
  FileUp,
  BarChart3,
  Check,
  Zap,
  Lock,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { DonateDialog } from "@/components/donate-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HomeFaqClient } from "@/components/home-faq-client"
import { InstallBanner } from "@/components/install-banner"

// Página estática pode ser cacheada
export const revalidate = 3600 // Revalidar a cada hora

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-100 via-pink-50 to-purple-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[20%] top-[20%] h-[400px] w-[400px] animate-float rounded-full bg-blue-400/40 dark:bg-blue-500/20 blur-[120px] dark:neon-glow" />
        <div className="absolute bottom-[20%] right-[20%] h-[500px] w-[500px] animate-float rounded-full bg-pink-400/40 dark:bg-blue-600/20 blur-[120px] dark:neon-glow [animation-delay:2s]" />
        <div className="absolute left-[50%] top-[50%] h-[350px] w-[350px] animate-pulse rounded-full bg-purple-400/30 dark:bg-blue-400/15 blur-[100px] dark:neon-glow" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-white/30 dark:border-blue-500/30 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl">
        <InstallBanner />
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <Image
              src="/logo_circular.png"
              alt="Brasil Dívidas"
              width={40}
              height={40}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-lg dark:neon-glow shrink-0"
              priority
            />
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-lg sm:text-xl font-bold text-transparent leading-tight">
              Gestão <span className="block sm:inline">de Dívidas</span>
            </span>
          </div>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-gray-700 dark:text-gray-300">
            <a className="hover:text-gray-900 dark:hover:text-white transition-colors" href="#recursos">
              Recursos
            </a>
            <a className="hover:text-gray-900 dark:hover:text-white transition-colors" href="#como-funciona">
              Como funciona
            </a>
            <a className="hover:text-gray-900 dark:hover:text-white transition-colors" href="#faq">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <DonateDialog />
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              variant="outline"
              className="bg-white/50 dark:bg-slate-900/30 backdrop-blur hover:bg-white/70 dark:hover:bg-slate-900/40 border-white/40 dark:border-blue-500/30 text-xs sm:text-sm px-2 sm:px-4"
            >
              <Link href="/demo">Ver Demo</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-pink-500 dark:from-blue-500 dark:to-blue-600 text-white shadow-lg dark:neon-glow transition-all hover:shadow-xl text-xs sm:text-sm px-2 sm:px-4"
            >
              <Link href="/auth/login?force=1">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-6 lg:py-20">
        <div className="mx-auto w-full max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-300/50 dark:border-blue-500/30 bg-white/70 dark:bg-slate-900/40 px-4 py-2 shadow-sm backdrop-blur-md dark:neon-border">
              <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Controle de compras parceladas, sem planilhas
              </span>
            </div>

            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-6xl">
              Organize suas{" "}
              <span className="bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                dívidas
              </span>{" "}
              e saiba quanto vai pagar em cada mês.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-gray-700 dark:text-gray-300 sm:text-lg">
              Cadastre compras, acompanhe parcelas e pague com um clique — com opção de anexar comprovante. Veja
              total a pagar por mês e nunca mais perca o controle.
            </p>

            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                size="lg"
                asChild
                className="w-full bg-gradient-to-r from-blue-500 to-pink-500 dark:from-blue-500 dark:to-blue-600 text-base sm:text-lg text-white shadow-xl dark:neon-glow transition-all hover:scale-[1.02] hover:shadow-2xl sm:w-auto"
              >
                <Link href="/auth/cadastro">
                  Criar conta grátis <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full border-2 border-blue-300/50 dark:border-blue-500/30 bg-white/70 dark:bg-slate-900/40 text-base sm:text-lg backdrop-blur-sm hover:bg-white/90 dark:hover:bg-slate-800/60 dark:neon-border sm:w-auto"
              >
                <Link href="/auth/login?force=1">Entrar</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full border-2 border-pink-300/40 dark:border-blue-500/25 bg-white/60 dark:bg-slate-900/30 text-base sm:text-lg backdrop-blur-sm hover:bg-white/90 dark:hover:bg-slate-800/60 sm:w-auto"
              >
                <Link href="/demo">Ver Demo</Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Badge
                variant="outline"
                className="bg-white/60 dark:bg-slate-900/40 border-white/40 dark:border-blue-500/30"
              >
                <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                100% grátis
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/60 dark:bg-slate-900/40 border-white/40 dark:border-blue-500/30"
              >
                <Lock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Dados privados
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/60 dark:bg-slate-900/40 border-white/40 dark:border-blue-500/30"
              >
                <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Rápido e simples
              </Badge>
            </div>
        </div>
      </section>

      <section
        id="recursos"
        className="scroll-mt-24 border-t border-white/30 dark:border-blue-500/20 mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-6 lg:py-20"
      >
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            Tudo o que você precisa para{" "}
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
              controlar
            </span>{" "}
            suas parcelas
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Foco total em clareza: quanto falta pagar, quando termina e qual o total por mês.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/30 dark:border-blue-500/25 shadow-lg dark:shadow-blue-500/10 dark:neon-border">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg dark:neon-glow">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">Gestão completa</CardTitle>
                  <CardDescription>Suas compras, em um lugar</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 dark:text-gray-300">
              Cadastre produto, loja, responsável e acompanhe o progresso de parcelas sem planilhas.
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/30 dark:border-blue-500/25 shadow-lg dark:shadow-blue-500/10 dark:neon-border">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg dark:neon-glow">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">Acompanhamento</CardTitle>
                  <CardDescription>Saiba o que falta pagar</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 dark:text-gray-300">
              Veja total pago, restante e o total mensal por mês para planejar o orçamento.
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/30 dark:border-blue-500/25 shadow-lg dark:shadow-blue-500/10 dark:neon-border">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg dark:neon-glow">
                  <CalendarCheck2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">Datas claras</CardTitle>
                  <CardDescription>Início e fim das parcelas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 dark:text-gray-300">
              Mostra a 1ª e a última parcela em dd/mm/aaaa para você se organizar.
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/30 dark:border-blue-500/25 shadow-lg dark:shadow-blue-500/10 dark:neon-border">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 text-white shadow-lg dark:neon-glow">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">Privacidade</CardTitle>
                  <CardDescription>Somente seus dados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 dark:text-gray-300">
              Seus dados ficam vinculados à sua conta e só você consegue acessar.
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-24 border-t border-white/30 dark:border-blue-500/20 mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-6 lg:py-20"
      >
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-14 items-start">
          <div>
            <h2 className="text-balance text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              Como funciona (em 3 passos)
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-xl">
              O objetivo é você bater o olho e saber: o que falta pagar, quando termina e o total do mês.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex gap-4">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 text-white shadow-lg dark:neon-glow shrink-0">
                  1
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Cadastre a compra</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Produto, loja, data da fatura, total de parcelas e valor (fixo ou variável).
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg dark:neon-glow shrink-0">
                  2
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Acompanhe por mês</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    O sistema monta um resumo com o total a pagar por mês, e mostra 1ª/última parcela.
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg dark:neon-glow shrink-0">
                  3
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Pague e anexe comprovante</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    No pagamento você pode anexar o comprovante (opcional) e manter o histórico organizado.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/30 dark:border-blue-500/25 shadow-xl dark:shadow-blue-500/10 dark:neon-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Datas automáticas
                </CardTitle>
                <CardDescription>1ª e última parcela (dd/mm/aaaa)</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 dark:text-gray-300">
                Você sempre sabe quando começa e quando termina, sem fazer conta.
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/30 dark:border-blue-500/25 shadow-xl dark:shadow-blue-500/10 dark:neon-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Total mensal
                </CardTitle>
                <CardDescription>Por mês, com nome do mês</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 dark:text-gray-300">
                Ideal pra planejar seu orçamento e evitar surpresas.
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/30 dark:border-blue-500/25 shadow-xl dark:shadow-blue-500/10 dark:neon-border sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Comprovante opcional
                </CardTitle>
                <CardDescription>PDF ou imagem</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 dark:text-gray-300">
                Anexe no momento do pagamento para ter tudo centralizado e fácil de achar depois.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-24 border-t border-white/30 dark:border-blue-500/20 mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-6 lg:py-20"
      >
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-balance text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              Perguntas frequentes
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Respostas rápidas para as dúvidas mais comuns.
            </p>
          </div>
          <HomeFaqClient />
        </div>
      </section>

      <section className="border-t border-white/30 dark:border-blue-500/20 mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-6 lg:py-20">
        <div className="flex flex-col items-center gap-5 sm:gap-6 rounded-3xl border border-white/40 dark:border-blue-500/30 bg-white/70 dark:bg-slate-900/40 p-6 sm:p-10 lg:p-12 text-center shadow-2xl dark:shadow-blue-500/10 dark:neon-border backdrop-blur-md">
          <h2 className="text-balance text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl md:text-5xl">
            Pronto para organizar suas{" "}
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">finanças?</span>
          </h2>
          <p className="max-w-2xl text-pretty text-base text-gray-700 dark:text-gray-300 sm:text-lg">
            Comece agora gratuitamente e tenha controle total das suas compras parceladas.
          </p>
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              asChild
              className="w-full bg-gradient-to-r from-blue-500 to-pink-500 dark:from-blue-500 dark:to-blue-600 text-lg text-white shadow-xl dark:neon-glow transition-all hover:scale-[1.02] hover:shadow-2xl sm:w-auto"
            >
              <Link href="/auth/cadastro">Começar agora</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full border-2 border-blue-300/50 dark:border-blue-500/30 bg-white/70 dark:bg-slate-900/40 text-lg backdrop-blur-sm hover:bg-white/90 dark:hover:bg-slate-800/60 dark:neon-border sm:w-auto"
            >
              <Link href="/dashboard">Ir para o dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Seção de Criadores/Apoiadores */}
      <section className="border-t border-white/30 dark:border-blue-500/20 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Criadores & Apoiadores
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Desenvolvido com 💙 por profissionais apaixonados por tecnologia
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 max-w-2xl mx-auto">
          {/* Guilherme Romera */}
          <a
            href="https://github.com/RomeraSCR"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-white/40 dark:border-blue-500/30 bg-white/70 dark:bg-slate-900/40 px-4 py-3 shadow-md dark:shadow-blue-500/10 dark:neon-border backdrop-blur-md transition-all hover:bg-white/80 dark:hover:bg-slate-800/60 hover:shadow-lg dark:hover:shadow-blue-500/20 w-full sm:w-auto"
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-blue-500/30 dark:border-blue-500/50 shrink-0">
              <img
                src="/romerascr.png"
                alt="Guilherme Romera"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">Guilherme Romera</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Github className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs text-blue-600 dark:text-blue-400 truncate">@RomeraSCR</span>
              </div>
            </div>
          </a>

          {/* Nick Tatehira */}
          <a
            href="https://github.com/tatehira"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-white/40 dark:border-blue-500/30 bg-white/70 dark:bg-slate-900/40 px-4 py-3 shadow-md dark:shadow-blue-500/10 dark:neon-border backdrop-blur-md transition-all hover:bg-white/80 dark:hover:bg-slate-800/60 hover:shadow-lg dark:hover:shadow-blue-500/20 w-full sm:w-auto"
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-blue-500/30 dark:border-blue-500/50 shrink-0">
              <img
                src="/nick.jpg"
                alt="Nick Tatehira"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">Nick Tatehira</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Github className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs text-blue-600 dark:text-blue-400 truncate">@tatehira</span>
              </div>
            </div>
          </a>
        </div>
      </section>

      <footer className="border-t border-white/40 dark:border-blue-500/30 bg-white/50 dark:bg-slate-900/40 py-8 backdrop-blur-md">
        <div className="container mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-sm text-gray-700 dark:text-gray-300 sm:px-6 lg:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo_circular.png"
              alt="Brasil Dívidas"
              width={20}
              height={20}
              className="h-5 w-5 rounded-full"
            />
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text font-semibold text-transparent">
              Gestão de Dívidas
            </span>
          </div>
          <p>Gerenciamento inteligente de dívidas e compras parceladas</p>
        </div>
      </footer>
    </div>
  )
}
