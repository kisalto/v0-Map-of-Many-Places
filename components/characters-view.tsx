"use client"

import { useState } from "react"
import { Search, Plus, Trash2, X, Edit2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CharacterCrudDialog } from "@/components/character-crud-dialog"

interface Character {
  id: string
  name: string
  short_description: string | null
  history: string | null
  image_url: string | null
}

interface Adventure {
  id: string
  title: string
  is_active?: boolean
}

interface CharactersViewProps {
  adventure: Adventure
  characters: Character[]
}

export function CharactersView({ adventure, characters }: CharactersViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [mentions, setMentions] = useState<any[]>([])
  const router = useRouter()

  const isActive = adventure.is_active !== false

  // Filter characters based on search
  const filteredCharacters = characters.filter((char) => char.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Load mentions when character is selected
  const handleSelectCharacter = async (character: Character) => {
    setSelectedCharacter(character)

    // Load mentions from database
    const supabase = createClient()
    const { data } = await supabase
      .from("character_mentions")
      .select("*, tasks(*)")
      .eq("character_name", character.name)

    setMentions(data || [])
  }

  const handleEdit = (character: Character) => {
    setEditingCharacter(character)
    setSelectedCharacter(null)
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
                    alt={character.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#EE9B3A]/20 to-[#302831] flex items-center justify-center">
                    <span className="text-6xl text-[#EE9B3A]/50">{character.name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Character info */}
              <div className="p-4">
                <h3 className="text-[#E7D1B1] font-serif text-lg mb-1">{character.name}</h3>
                <p className="text-[#9F8475] text-sm line-clamp-2">{character.short_description || "Sem descrição"}</p>
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
                <DialogTitle className="text-2xl font-serif text-[#EE9B3A]">{selectedCharacter.name}</DialogTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!isActive}
                    onClick={() => handleEdit(selectedCharacter)}
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
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#EE9B3A]/20 to-[#302831] flex items-center justify-center">
                    <span className="text-8xl text-[#EE9B3A]/50">{selectedCharacter.name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Character details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[#EE9B3A] font-serif mb-2">História</h4>
                  <p className="text-[#E7D1B1] leading-relaxed text-sm">
                    {selectedCharacter.history || selectedCharacter.short_description || "Nenhuma história disponível."}
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

      {/* Character edit dialog */}
      <CharacterCrudDialog
        open={!!editingCharacter}
        onOpenChange={(open) => !open && setEditingCharacter(null)}
        adventureId={adventure.id}
        character={editingCharacter}
        onSuccess={() => {
          setEditingCharacter(null)
          router.refresh()
        }}
      />
    </main>
  )
}
