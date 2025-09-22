"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Loader2, Edit, Trash2, Calendar, MapPin, ExternalLink } from "lucide-react"

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

interface TimelineEntry {
  id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
}

interface CharacterDetailDialogProps {
  character: NPC | Player
  type: "npc" | "player"
  children: React.ReactNode
}

export function CharacterDetailDialog({ character, type, children }: CharacterDetailDialogProps) {
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(type === "npc" ? (character as NPC).name : (character as Player).character_name)
  const [description, setDescription] = useState(character.description || "")
  const [status, setStatus] = useState(character.status)
  const [notes, setNotes] = useState(character.notes || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appearances, setAppearances] = useState<TimelineEntry[]>([])
  const [loadingAppearances, setLoadingAppearances] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      loadAppearances()
    }
  }, [open, character.id])

  const loadAppearances = async () => {
    setLoadingAppearances(true)
    try {
      const supabase = createClient()

      // Get adventure_id from character
      let adventureId: string | null = null

      if (type === "npc") {
        const { data: npcData } = await supabase.from("npcs").select("adventure_id").eq("id", character.id).single()
        adventureId = npcData?.adventure_id
      } else {
        const { data: playerData } = await supabase
          .from("adventure_players")
          .select("adventure_id")
          .eq("id", character.id)
          .single()
        adventureId = playerData?.adventure_id
      }

      if (!adventureId) return

      // Get all timeline entries for this adventure
      const { data: entries } = await supabase
        .from("timeline_entries")
        .select("id, title, description, order_index, created_at")
        .eq("adventure_id", adventureId)
        .order("order_index")

      // Filter entries that mention this character
      const characterName = type === "npc" ? (character as NPC).name : (character as Player).character_name
      const mentionRegex = new RegExp(`@${characterName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")

      const mentionedEntries = (entries || []).filter(
        (entry) => entry.description && mentionRegex.test(entry.description),
      )

      setAppearances(mentionedEntries)
    } catch (error) {
      console.error("Error loading appearances:", error)
    } finally {
      setLoadingAppearances(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      if (type === "npc") {
        const { error } = await supabase
          .from("npcs")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            status,
            notes: notes.trim() || null,
          })
          .eq("id", character.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("adventure_players")
          .update({
            character_name: name.trim(),
            description: description.trim() || null,
            status,
            notes: notes.trim() || null,
          })
          .eq("id", character.id)

        if (error) throw error
      }

      setIsEditing(false)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar personagem")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const supabase = createClient()

      if (type === "npc") {
        const { error } = await supabase.from("npcs").delete().eq("id", character.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("adventure_players").delete().eq("id", character.id)
        if (error) throw error
      }

      setOpen(false)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao deletar personagem")
    } finally {
      setIsDeleting(false)
    }
  }

  const displayName = type === "npc" ? (character as NPC).name : (character as Player).character_name
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 bg-slate-600">
              <AvatarFallback className="bg-slate-600 text-slate-300 text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-lg">{displayName}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    character.status === "alive" || character.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : character.status === "dead"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {character.status}
                </Badge>
                <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                  {type === "npc" ? "NPC" : "Jogador"}
                </Badge>
              </div>
            </div>
          </div>
          {type === "player" && (character as Player).profiles && (
            <DialogDescription className="text-slate-300">
              Jogado por: {(character as Player).profiles?.display_name}
            </DialogDescription>
          )}
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-slate-200">
                  {type === "npc" ? "Nome do NPC" : "Nome do Personagem"}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-slate-200">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white min-h-[80px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-slate-200">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {type === "npc" ? (
                      <>
                        <SelectItem value="alive" className="text-white hover:bg-slate-700">
                          Vivo
                        </SelectItem>
                        <SelectItem value="dead" className="text-white hover:bg-slate-700">
                          Morto
                        </SelectItem>
                        <SelectItem value="unknown" className="text-white hover:bg-slate-700">
                          Desconhecido
                        </SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="active" className="text-white hover:bg-slate-700">
                          Ativo
                        </SelectItem>
                        <SelectItem value="inactive" className="text-white hover:bg-slate-700">
                          Inativo
                        </SelectItem>
                        <SelectItem value="dead" className="text-white hover:bg-slate-700">
                          Morto
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-slate-200">
                  Anotações
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white min-h-[60px]"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="py-4 space-y-4">
              {character.description && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Descrição</h4>
                  <p className="text-sm text-slate-200">{character.description}</p>
                </div>
              )}
              {character.notes && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Anotações</h4>
                  <p className="text-sm text-slate-200">{character.notes}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Aparições na Timeline ({appearances.length})
                </h4>
                {loadingAppearances ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Carregando aparições...</span>
                  </div>
                ) : appearances.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {appearances.map((entry) => (
                      <Card key={entry.id} className="bg-slate-700/50 border-slate-600">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium text-white line-clamp-1">{entry.title}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-slate-600 text-slate-300 text-xs">
                                  Sessão #{entry.order_index + 1}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-slate-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Este personagem ainda não apareceu em nenhuma entrada da timeline.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                <span>Criado em {new Date(character.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="border-red-600 text-red-400 hover:bg-red-600/10 bg-transparent"
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Deletar
              </Button>
              <Button onClick={() => setIsEditing(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
