"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Users, Scroll, Settings } from "lucide-react"
import Link from "next/link"
import { CreateTimelineEntryDialog } from "@/components/create-timeline-entry-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserProfile } from "@/components/user-profile"

interface Adventure {
  id: string
  title: string
  description: string | null
  created_at: string
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
  return (
    <header className="border-b border-[#EE9B3A]/30 bg-[#0B0A13]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-[#E7D1B1] hover:text-[#EE9B3A]">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div className="h-6 w-px bg-[#302831]" />
            <div>
              <h1 className="text-xl font-serif font-bold text-[#E7D1B1]">{adventure.title}</h1>
              {adventure.description && <p className="text-sm text-[#9F8475]">{adventure.description}</p>}
            </div>
            <Badge variant="secondary" className="bg-[#84E557]/20 text-[#84E557] border-[#84E557]/30">
              <Scroll className="h-3 w-3 mr-1" />
              Ativa
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#EE9B3A]/30 text-[#E7D1B1] hover:bg-[#302831] bg-transparent"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0B0A13] border-[#EE9B3A]/30" align="end">
                <DropdownMenuItem className="text-[#E7D1B1] hover:bg-[#302831] cursor-pointer focus:bg-[#302831]">
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Jogadores
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[#E7D1B1] hover:bg-[#302831] cursor-pointer focus:bg-[#302831]">
                  <Scroll className="mr-2 h-4 w-4" />
                  Configurações da Aventura
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CreateTimelineEntryDialog adventureId={adventure.id}>
              <Button className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13] font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Nova Entrada
              </Button>
            </CreateTimelineEntryDialog>
            <UserProfile profile={profile} />
          </div>
        </div>
      </div>
    </header>
  )
}
