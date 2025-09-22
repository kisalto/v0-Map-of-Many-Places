"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Compass, Scroll, Users, BookOpen, Sword } from "lucide-react"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (user) {
        router.push("/dashboard")
      }
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <MapPin className="h-8 w-8 text-amber-700" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-amber-900">Map of Many Things</h1>
                <p className="text-sm text-amber-700">Cartógrafo de Aventuras RPG</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                asChild
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 bg-transparent"
              >
                <Link href="/auth/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
                <Link href="/auth/signup">Criar Conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Compass className="h-16 w-16 text-amber-600" />
            <Scroll className="h-16 w-16 text-amber-700" />
          </div>
          <h2 className="text-4xl font-serif font-bold text-amber-900 mb-4">Mapeie Suas Aventuras</h2>
          <p className="text-xl text-amber-800 max-w-2xl mx-auto mb-8">
            Crie, organize e explore campanhas de RPG como um verdadeiro cartógrafo. Documente cada jornada, personagem
            e descoberta em seu mapa pessoal de aventuras.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
              <Link href="/auth/signup">Começar Exploração</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-amber-300 text-amber-700 hover:bg-amber-50 bg-transparent"
            >
              <Link href="/auth/login">Já Sou Explorador</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-amber-200 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="p-3 bg-amber-100 rounded-full w-fit">
                <BookOpen className="h-6 w-6 text-amber-700" />
              </div>
              <CardTitle className="text-amber-900 font-serif">Campanhas Organizadas</CardTitle>
              <CardDescription className="text-amber-700">
                Crie e gerencie suas campanhas como um verdadeiro mestre cartógrafo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                Organize aventuras, personagens e histórias em um sistema intuitivo que cresce com suas campanhas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="p-3 bg-amber-100 rounded-full w-fit">
                <Users className="h-6 w-6 text-amber-700" />
              </div>
              <CardTitle className="text-amber-900 font-serif">Colaboração</CardTitle>
              <CardDescription className="text-amber-700">
                Convide outros exploradores para suas jornadas épicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                Trabalhe em equipe com jogadores e mestres, compartilhando descobertas e construindo histórias juntos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="p-3 bg-amber-100 rounded-full w-fit">
                <Sword className="h-6 w-6 text-amber-700" />
              </div>
              <CardTitle className="text-amber-900 font-serif">Timeline de Aventuras</CardTitle>
              <CardDescription className="text-amber-700">
                Documente cada momento importante de suas jornadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                Registre eventos, decisões e descobertas em uma linha do tempo visual e interativa.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-12 border border-amber-200">
          <h3 className="text-3xl font-serif font-bold text-amber-900 mb-4">Pronto para Começar sua Jornada?</h3>
          <p className="text-amber-800 mb-6 max-w-xl mx-auto">
            Junte-se a outros exploradores e mestres que já estão mapeando suas aventuras épicas no Map of Many Things.
          </p>
          <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
            <Link href="/auth/signup">Criar Minha Conta</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
