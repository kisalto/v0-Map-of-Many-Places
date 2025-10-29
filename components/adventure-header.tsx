"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserProfile } from "@/components/user-profile"

interface Adventure {
  id: string
  title: string
  description: string | null
}

interface AdventureHeaderProps {
  adventure: Adventure
  profile: {
    id: string
    username: string
    display_name: string
    email: string
  } | null
}

export function AdventureHeader({ adventure, profile }: AdventureHeaderProps) {
  const pathname = usePathname()

  const isTimelinePage = pathname === `/adventure/${adventure.id}`
  const isCharactersPage = pathname === `/adventure/${adventure.id}/characters`
  const isRegionsPage = pathname === `/adventure/${adventure.id}/regions`
  const isSearchPage = pathname === `/adventure/${adventure.id}/search`

  return (
    <header className="border-b border-[#EE9B3A]/30 bg-[#0B0A13]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild className="text-[#E7D1B1] hover:text-[#EE9B3A]">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>

            <div className="h-6 w-px bg-[#302831]" />

            <h1 className="text-xl font-serif font-bold text-[#E7D1B1]">{adventure.title}</h1>

            <div className="h-6 w-px bg-[#302831]" />

            <nav className="flex items-center gap-1">
              <Link href={`/adventure/${adventure.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${
                    isTimelinePage
                      ? "text-[#EE9B3A] border-b-2 border-[#EE9B3A] rounded-none"
                      : "text-[#E7D1B1] hover:text-[#EE9B3A]"
                  }`}
                >
                  Linha do Tempo
                </Button>
              </Link>

              <Link href={`/adventure/${adventure.id}/characters`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${
                    isCharactersPage
                      ? "text-[#EE9B3A] border-b-2 border-[#EE9B3A] rounded-none"
                      : "text-[#E7D1B1] hover:text-[#EE9B3A]"
                  }`}
                >
                  Personagens
                </Button>
              </Link>

              <Link href={`/adventure/${adventure.id}/regions`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${
                    isRegionsPage
                      ? "text-[#EE9B3A] border-b-2 border-[#EE9B3A] rounded-none"
                      : "text-[#E7D1B1] hover:text-[#EE9B3A]"
                  }`}
                >
                  Regiões
                </Button>
              </Link>

              <Link href={`/adventure/${adventure.id}/search`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${
                    isSearchPage
                      ? "text-[#EE9B3A] border-b-2 border-[#EE9B3A] rounded-none"
                      : "text-[#E7D1B1] hover:text-[#EE9B3A]"
                  }`}
                >
                  Busca
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-[#84E557]/20 text-[#84E557] border-[#84E557]/30">
              Ativa
            </Badge>

            <Button
              variant="outline"
              size="sm"
              className="border-[#302831] text-[#E7D1B1] hover:bg-[#302831] bg-transparent"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>

            <Button asChild className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13] font-semibold">
              <Link href={`/adventure/${adventure.id}/entry/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Entrada
              </Link>
            </Button>

            <UserProfile profile={profile} />
          </div>
        </div>
      </div>
    </header>
  )
}
