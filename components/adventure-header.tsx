"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Users, Scroll, Settings } from "lucide-react"
import Link from "next/link"
import { CreateTimelineEntryDialog } from "@/components/create-timeline-entry-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Adventure {
  id: string
  title: string
  description: string | null
  created_at: string
}

interface AdventureHeaderProps {
  adventure: Adventure
}

export function AdventureHeader({ adventure }: AdventureHeaderProps) {
  return (
    <header className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:text-white">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div className="h-6 w-px bg-slate-600" />
            <div>
              <h1 className="text-xl font-bold text-white">{adventure.title}</h1>
              {adventure.description && <p className="text-sm text-slate-300">{adventure.description}</p>}
            </div>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
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
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                <DropdownMenuItem className="text-slate-200 hover:bg-slate-700 cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Jogadores
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-200 hover:bg-slate-700 cursor-pointer">
                  <Scroll className="mr-2 h-4 w-4" />
                  Configurações da Aventura
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CreateTimelineEntryDialog adventureId={adventure.id}>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nova Entrada
              </Button>
            </CreateTimelineEntryDialog>
          </div>
        </div>
      </div>
    </header>
  )
}
