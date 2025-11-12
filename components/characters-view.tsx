"use client"

import { useState } from "react"
import { Search, Plus, Trash2, X, Edit2, Check, MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CharacterCrudDialog } from "@/components/character-crud-dialog"
import Link from "next/link"

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

interface TimelineEntryMention {
  id: string
  title: string
  content: string | null
  created_at: string
  chapter_id: string | null
  task_id: string
}

export function CharactersView({ adventure, characters }: CharactersViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [mentions, setMentions] = useState<TimelineEntryMention[]>([])
  const [loadingMentions, setLoadingMentions] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const isActive = adventure.is_active !== false

  const filteredCharacters = characters.filter((char) => char.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelectCharacter = async (character: Character) => {
    console.log("[v0] Character selected:", character.name)
    setSelectedCharacter(character)
    setMentions([])
    setLoadingMentions(true)

    try {
      const supabase = createClient()

      console.log("[v0] Fetching character mentions for character_id:", character.id)

      const { data: mentionsData, error: mentionsError } = await supabase
        .from("character_mentions")
        .select(
          `
          timeline_entry_id,
          task_id,
          timeline_entries (
            id,
            title,
            content,
            created_at,
            chapter_id
          )
        `,
        )
        .eq("character_id", character.id)

      if (mentionsError) {
        console.error("[v0] Error fetching character mentions:", mentionsError)
        return
      }

      console.log("[v0] Character mentions found:", mentionsData?.length || 0)

      const timelineEntries = (mentionsData || [])
        .map((mention: any) => {
          if (mention.timeline_entries) {
            return {
              ...mention.timeline_entries,
              task_id: mention.task_id,
            }
          }
          return null
        })
        .filter((entry: any) => entry !== null) as TimelineEntryMention[]

      console.log("[v0] Timeline entries extracted:", timelineEntries.length)
      setMentions(timelineEntries)
    } catch (error) {
      console.error("[v0] Error loading character mentions:", error)
    } finally {
      setLoadingMentions(false)
    }
  }

  const handleEdit = (character: Character) => {
    setEditingCharacter(character)
    setSelectedCharacter(null)
  }

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode)
    setSelectedForDeletion(new Set())
  }

  const handleToggleSelection = (characterId: string) => {
    const newSelection = new Set(selectedForDeletion)
    if (newSelection.has(characterId)) {
      newSelection.delete(characterId)
    } else {
      newSelection.add(characterId)
    }
    setSelectedForDeletion(newSelection)
  }

  const handleConfirmDelete = async () => {
    const supabase = createClient()

    for (const characterId of selectedForDeletion) {
      await supabase.from("characters").delete().eq("id", characterId)
    }

    setIsDeleteMode(false)
    setSelectedForDeletion(new Set())
    setShowDeleteConfirm(false)
    router.refresh()
  }

  const handleCancelDelete = () => {
    setIsDeleteMode(false)
    setSelectedForDeletion(new Set())
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar personagens..."
            className="pl-10 bg-card border-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          {!isDeleteMode ? (
            <>
              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={!isActive}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Personagem
              </Button>
              <Button
                onClick={handleToggleDeleteMode}
                disabled={!isActive}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/20 hover:border-primary bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Personagem
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCancelDelete}
                variant="outline"
                className="border-border text-foreground hover:bg-muted bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedForDeletion.size === 0}
                className="bg-enemy hover:bg-enemy/90 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar ({selectedForDeletion.size})
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCharacters.map((character) => (
          <Card
            key={character.id}
            onClick={() => !isDeleteMode && handleSelectCharacter(character)}
            className="bg-card border-primary/30 hover:bg-card/70 transition-all cursor-pointer group relative"
          >
            {isDeleteMode && (
              <div
                className="absolute top-4 left-4 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleSelection(character.id)
                }}
              >
                <Checkbox checked={selectedForDeletion.has(character.id)} className="bg-background border-primary" />
              </div>
            )}
            <CardContent className="p-0">
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                {character.image_url ? (
                  <img
                    src={character.image_url || "/placeholder.svg"}
                    alt={character.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-card flex items-center justify-center">
                    <span className="text-6xl text-primary/50">{character.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-foreground font-serif text-lg mb-1">{character.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {character.short_description || "Sem descrição"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir {selectedForDeletion.size}{" "}
              {selectedForDeletion.size === 1 ? "personagem" : "personagens"}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-enemy hover:bg-enemy/90 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedCharacter && (
        <Dialog open={!!selectedCharacter} onOpenChange={() => setSelectedCharacter(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background border-primary/30 text-foreground">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-serif text-primary">{selectedCharacter.name}</DialogTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!isActive}
                    onClick={() => handleEdit(selectedCharacter)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedCharacter(null)}
                    className="text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="aspect-[3/4] rounded-lg overflow-hidden">
                {selectedCharacter.image_url ? (
                  <img
                    src={selectedCharacter.image_url || "/placeholder.svg"}
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-card flex items-center justify-center">
                    <span className="text-8xl text-primary/50">{selectedCharacter.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-primary font-serif mb-2">História</h4>
                  <p className="text-foreground leading-relaxed text-sm">
                    {selectedCharacter.history || selectedCharacter.short_description || "Nenhuma história disponível."}
                  </p>
                </div>

                <div>
                  <h4 className="text-primary font-serif mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Aparições nas Anotações ({mentions.length})
                  </h4>
                  {loadingMentions ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Carregando aparições...</span>
                    </div>
                  ) : mentions.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {mentions.map((entry) => (
                        <Link
                          key={entry.id}
                          href={`/adventure/${adventure.id}/entry/${entry.task_id}`}
                          className="block"
                        >
                          <Card className="bg-card border-primary/30 hover:bg-card/90 transition-colors cursor-pointer">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-foreground line-clamp-1">{entry.title}</h5>
                                  {entry.content && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{entry.content}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                                      Anotação
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Este personagem ainda não foi mencionado em nenhuma anotação.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <CharacterCrudDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        adventureId={adventure.id}
        onSuccess={() => {
          setShowCreateDialog(false)
          router.refresh()
        }}
      />

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
