import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Map, Scroll } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-[#302831]">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-[#EE9B3A]" />
            <h1 className="text-2xl font-bold text-[#EE9B3A]">RPG Adventures</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-background" asChild>
              <Link href="/auth/signup">Criar Conta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 text-balance">
          Crie e Gerencie Suas <span className="text-[#EE9B3A]">Aventuras de RPG</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          Uma plataforma completa para mestres e jogadores organizarem campanhas, personagens, regiões e histórias
          épicas.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-background" asChild>
            <Link href="/auth/signup">Começar Agora</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Já tenho conta</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/50 backdrop-blur border-border/40">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 rounded-lg bg-[#EE9B3A]/10">
                  <BookOpen className="h-8 w-8 text-[#EE9B3A]" />
                </div>
                <h3 className="text-xl font-semibold">Aventuras</h3>
                <p className="text-muted-foreground text-sm">
                  Organize suas campanhas em capítulos e anotações detalhadas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/40">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 rounded-lg bg-[#EE9B3A]/10">
                  <Users className="h-8 w-8 text-[#EE9B3A]" />
                </div>
                <h3 className="text-xl font-semibold">Personagens</h3>
                <p className="text-muted-foreground text-sm">
                  Gerencie NPCs e jogadores com fichas completas e relacionamentos
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/40">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 rounded-lg bg-[#EE9B3A]/10">
                  <Map className="h-8 w-8 text-[#EE9B3A]" />
                </div>
                <h3 className="text-xl font-semibold">Regiões</h3>
                <p className="text-muted-foreground text-sm">Crie mapas e localizações com sub-regiões hierárquicas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/40">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 rounded-lg bg-[#EE9B3A]/10">
                  <Scroll className="h-8 w-8 text-[#EE9B3A]" />
                </div>
                <h3 className="text-xl font-semibold">Menções</h3>
                <p className="text-muted-foreground text-sm">
                  Conecte personagens e regiões com menções @personagem e #região
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="bg-[#EE9B3A]/10 border-[#EE9B3A]/20">
          <CardContent className="pt-12 pb-12">
            <h2 className="text-3xl font-bold mb-4">Pronto para começar sua jornada?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Junte-se a mestres e jogadores que já estão criando histórias incríveis
            </p>
            <Button size="lg" className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-background" asChild>
              <Link href="/auth/signup">Criar Conta Grátis</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <p>© 2025 RPG Adventures. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
