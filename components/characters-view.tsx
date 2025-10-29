"use client"

import { useState } from "react"
import { Search, Plus, Trash2, X, Edit2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CharacterCrudDialog } from "@/components/character-crud-dialog"

interface NPC {
  id: string
  name: string
  description: string | null
  image_url: string | null
  status: string
  notes: string | null
}

interface Player {
  id: string
  character_name: string
  description: string | null
  image_url: string | null
  status: string
  notes: string | null
}

interface Adventure {
  id: string
  title: string
  is_active?: boolean
}

interface CharactersViewProps {
  adventure: Adventure
  npcs: NPC[]
  players: Player[]
}

export function CharactersView({ adventure, npcs, players }: CharactersViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCharacter, setSelectedCharacter] = useState<(NPC | Player) | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [mentions, setMentions] = useState<any[]>([])
  const router = useRouter()

  const isActive = adventure.is_active !== false

  // Combine NPCs and players
  const allCharacters = [
    ...npcs.map((npc) => ({ ...npc, type: "npc" as const, displayName: npc.name })),
    ...players.map((player) => ({ ...player, type: "player" as const, displayName: player.character_name })),
  ]

  // Filter characters based on search
  const filteredCharacters = allCharacters.filter((char) =>
    char.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Load mentions when character is selected
  const handleSelectCharacter = async (character: any) => {
    setSelectedCharacter(character)

    // Load mentions from database
    const supabase = createClient()
    const { data } = await supabase
      .from("character_mentions")
      .select("*, tasks(*)")
      .eq("character_name", character.displayName)

    setMentions(data || [])
  }

  return (
    <main className="container mx-auto px-6 py-8">
      {/* Header with search and actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9F8475]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar personagens..."
            className="pl-10 bg-[#302831] border-[#EE9B3A]/30 text-[#E7D1B1] placeholder:text-[#9F8475]"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={!isActive}
            className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Personagem
          </Button>
          <Button
            disabled={!isActive}
            variant="outline"
            className="border-[#EE9B3A]/30 text-[#EE9B3A] hover:bg-[#EE9B3A]/10 bg-transparent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover Personagem
          </Button>
        </div>
      </div>

      {/* Characters grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCharacters.map((character) => (
          <Card
            key={character.id}
            onClick={() => handleSelectCharacter(character)}
            className="bg-[#302831] border-[#EE9B3A]/30 hover:bg-[#302831]/80 transition-all cursor-pointer group"
          >
            <CardContent className="p-0">
              {/* Character image */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                {character.image_url ? (
                  <img
                    src={character.image_url || "/placeholder.svg"}
                    alt={character.displayName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#EE9B3A]/20 to-[#302831] flex items-center justify-center">
                    <span className="text-6xl text-[#EE9B3A]/50">{character.displayName.charAt(0)}</span>
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <Badge
                    className={
                      character.status === "alive" || character.status === "active"
                        ? "bg-[#84E557]/20 text-[#84E557] border-[#84E557]/30"
                        : "bg-[#9F8475]/20 text-[#9F8475] border-[#9F8475]/30"
                    }
                  >
                    {character.status === "alive" || character.status === "active" ? "Vivo" : "Morto"}
                  </Badge>
                </div>
              </div>

              {/* Character info */}
              <div className="p-4">
                <h3 className="text-[#E7D1B1] font-serif text-lg mb-1">{character.displayName}</h3>
                <p className="text-[#9F8475] text-sm line-clamp-2">
                  {character.description || (character.type === "npc" ? "NPC" : "Jogador")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Character detail dialog */}
      {selectedCharacter && (
        <Dialog open={!!selectedCharacter} onOpenChange={() => setSelectedCharacter(null)}>
          <DialogContent className="max-w-4xl bg-[#0B0A13] border-[#EE9B3A]/30 text-[#E7D1B1]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-serif text-[#EE9B3A]">
                  {selectedCharacter.displayName}
                </DialogTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!isActive}
                    className="text-[#EE9B3A] hover:bg-[#EE9B3A]/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedCharacter(null)}
                    className="text-[#9F8475] hover:bg-[#9F8475]/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Character image */}
              <div className="aspect-[3/4] rounded-lg overflow-hidden">
                {selectedCharacter.image_url ? (
                  <img
                    src={selectedCharacter.image_url || "/placeholder.svg"}
                    alt={selectedCharacter.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#EE9B3A]/20 to-[#302831] flex items-center justify-center">
                    <span className="text-8xl text-[#EE9B3A]/50">{selectedCharacter.displayName.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Character details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[#EE9B3A] font-serif mb-2">Descrição</h4>
                  <p className="text-[#E7D1B1] leading-relaxed">
                    {selectedCharacter.description || "Nenhuma descrição disponível."}
                  </p>
                </div>

                <div>
                  <h4 className="text-[#EE9B3A] font-serif mb-2">Aparições</h4>
                  {mentions.length > 0 ? (
                    <div className="space-y-2">
                      {mentions.map((mention) => (
                        <div
                          key={mention.id}
                          className="text-[#EE9B3A] hover:underline cursor-pointer text-sm"
                          onClick={() => router.push(`/adventure/${adventure.id}/entry/${mention.task_id}`)}
                        >
                          {mention.tasks?.title || "Anotação sem título"}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#9F8475] text-sm">Nenhuma aparição registrada.</p>
                  )}
                </div>

                {selectedCharacter.notes && (
                  <div>
                    <h4 className="text-[#EE9B3A] font-serif mb-2">Notas</h4>
                    <p className="text-[#E7D1B1] text-sm leading-relaxed">{selectedCharacter.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Character creation dialog */}
      <CharacterCrudDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        adventureId={adventure.id}
        onSuccess={() => {
          setShowCreateDialog(false)
          router.refresh()
        }}
      />
    </main>
  )
}
