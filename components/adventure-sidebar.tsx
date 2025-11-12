"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Crown, Sword, Plus } from "lucide-react"
import { CreateNPCDialog } from "@/components/create-npc-dialog"
import { CreatePlayerDialog } from "@/components/create-player-dialog"
import { CharacterDetailDialog } from "@/components/character-detail-dialog"

interface NPC {
  id: string
  name: string
  description: string | null
  status: string
  notes: string | null
  created_at: string
}

interface Player {
  id: string
  character_name: string
  description: string | null
  status: string
  notes: string | null
  created_at: string
  profiles: {
    display_name: string
  } | null
}

interface AdventureSidebarProps {
  adventure: { id: string; title: string }
  npcs: NPC[]
  players: Player[]
}

export function AdventureSidebar({ adventure, npcs, players }: AdventureSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (isCollapsed) {
    return (
      <div className="w-12 bg-card/50 border-r border-border flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Users className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <aside className="w-80 bg-card/50 border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Personagens</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="npcs" className="h-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted m-4">
            <TabsTrigger value="npcs" className="data-[state=active]:bg-card">
              NPCs
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-card">
              Jogadores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="npcs" className="px-4 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">NPCs ({npcs.length})</h3>
              <CreateNPCDialog adventureId={adventure.id}>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted bg-transparent"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo
                </Button>
              </CreateNPCDialog>
            </div>
            {npcs.length === 0 ? (
              <div className="text-center py-8">
                <Crown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum NPC ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {npcs.map((npc) => (
                  <CharacterDetailDialog key={npc.id} character={npc} type="npc">
                    <Card className="bg-card/70 border-border hover:bg-card cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 bg-muted">
                            <AvatarFallback className="bg-muted text-foreground text-xs">
                              {npc.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-foreground truncate">{npc.name}</h4>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  npc.status === "alive"
                                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                    : npc.status === "dead"
                                      ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                      : "bg-muted/50 text-muted-foreground"
                                }`}
                              >
                                {npc.status}
                              </Badge>
                            </div>
                            {npc.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{npc.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CharacterDetailDialog>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="players" className="px-4 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Jogadores ({players.length})</h3>
              <CreatePlayerDialog adventureId={adventure.id}>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted bg-transparent"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Convidar
                </Button>
              </CreatePlayerDialog>
            </div>
            {players.length === 0 ? (
              <div className="text-center py-8">
                <Sword className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum jogador ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player) => (
                  <CharacterDetailDialog key={player.id} character={player} type="player">
                    <Card className="bg-card/70 border-border hover:bg-card cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 bg-muted">
                            <AvatarFallback className="bg-muted text-foreground text-xs">
                              {player.character_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-foreground truncate">{player.character_name}</h4>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  player.status === "active"
                                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                    : player.status === "dead"
                                      ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                      : "bg-muted/50 text-muted-foreground"
                                }`}
                              >
                                {player.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Jogado por: {player.profiles?.display_name || "Desconhecido"}
                            </p>
                            {player.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{player.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CharacterDetailDialog>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  )
}
