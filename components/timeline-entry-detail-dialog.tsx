"use client"

import type React from "react"

import { useState } from "react"
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
import { CharacterMentionInput } from "@/components/character-mention-input"
import { CharacterMentionDisplay } from "@/components/character-mention-display"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Loader2, Edit, Trash2, Calendar, ArrowUp, ArrowDown } from "lucide-react"

interface TimelineEntry {
  id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

interface TimelineEntryDetailDialogProps {
  entry: TimelineEntry
  adventureId: string
  totalEntries: number
  children: React.ReactNode
}

export function TimelineEntryDetailDialog({
  entry,
  adventureId,
  totalEntries,
  children,
}: TimelineEntryDetailDialogProps) {
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [title, setTitle] = useState(entry.title)
  const [description, setDescription] = useState(entry.description || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("timeline_entries")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id)

      if (error) throw error

      // Update mentions
      await updateMentions(entry.id, description.trim())

      setIsEditing(false)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar entrada")
    } finally {
      setIsLoading(false)
    }
  }

  const updateMentions = async (entryId: string, text: string) => {
    const supabase = createClient()

    // Delete existing mentions
    await supabase.from("character_mentions").delete().eq("timeline_entry_id", entryId)

    if (!text) return

    // Load characters to match mentions
    const { data: npcs } = await supabase.from("npcs").select("id, name").eq("adventure_id", adventureId)
    const { data: players } = await supabase
      .from("adventure_players")
      .select("id, character_name")
      .eq("adventure_id", adventureId)

    const allCharacters = [
      ...(npcs || []).map((npc) => ({ id: npc.id, name: npc.name, type: "npc" as const })),
      ...(players || []).map((player) => ({ id: player.id, name: player.character_name, type: "player" as const })),
    ]

    // Find all mentions in text
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g
    const mentions = []
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionName = match[1]
      const character = allCharacters.find((char) => char.name.toLowerCase() === mentionName.toLowerCase())

      if (character) {
        mentions.push({
          timeline_entry_id: entryId,
          character_type: character.type,
          character_id: character.id,
          mention_text: match[0],
        })
      }
    }

    // Save mentions to database
    if (mentions.length > 0) {
      const { error } = await supabase.from("character_mentions").insert(mentions)
      if (error) console.error("Error saving mentions:", error)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Delete the entry (mentions will be deleted by cascade)
      const { error: deleteError } = await supabase.from("timeline_entries").delete().eq("id", entry.id)

      if (deleteError) throw deleteError

      // Reorder remaining entries
      const { data: remainingEntries, error: fetchError } = await supabase
        .from("timeline_entries")
        .select("id, order_index")
        .eq("adventure_id", adventureId)
        .gt("order_index", entry.order_index)
        .order("order_index")

      if (fetchError) throw fetchError

      // Update order_index for remaining entries
      if (remainingEntries && remainingEntries.length > 0) {
        const updates = remainingEntries.map((e, index) => ({
          id: e.id,
          order_index: entry.order_index + index,
        }))

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from("timeline_entries")
            .update({ order_index: update.order_index })
            .eq("id", update.id)

          if (updateError) throw updateError
        }
      }

      setOpen(false)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao deletar entrada")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMoveUp = async () => {
    if (entry.order_index === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get the entry that's currently above this one
      const { data: aboveEntry, error: fetchError } = await supabase
        .from("timeline_entries")
        .select("id, order_index")
        .eq("adventure_id", adventureId)
        .eq("order_index", entry.order_index - 1)
        .single()

      if (fetchError || !aboveEntry) throw new Error("Entrada anterior não encontrada")

      // Swap order_index values
      const { error: updateError1 } = await supabase
        .from("timeline_entries")
        .update({ order_index: entry.order_index })
        .eq("id", aboveEntry.id)

      if (updateError1) throw updateError1

      const { error: updateError2 } = await supabase
        .from("timeline_entries")
        .update({ order_index: entry.order_index - 1 })
        .eq("id", entry.id)

      if (updateError2) throw updateError2

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao mover entrada")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMoveDown = async () => {
    if (entry.order_index >= totalEntries - 1) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get the entry that's currently below this one
      const { data: belowEntry, error: fetchError } = await supabase
        .from("timeline_entries")
        .select("id, order_index")
        .eq("adventure_id", adventureId)
        .eq("order_index", entry.order_index + 1)
        .single()

      if (fetchError || !belowEntry) throw new Error("Próxima entrada não encontrada")

      // Swap order_index values
      const { error: updateError1 } = await supabase
        .from("timeline_entries")
        .update({ order_index: entry.order_index })
        .eq("id", belowEntry.id)

      if (updateError1) throw updateError1

      const { error: updateError2 } = await supabase
        .from("timeline_entries")
        .update({ order_index: entry.order_index + 1 })
        .eq("id", entry.id)

      if (updateError2) throw updateError2

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao mover entrada")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg">{entry.title}</DialogTitle>
              <DialogDescription className="text-slate-300 mt-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                    #{entry.order_index + 1}
                  </Badge>
                  <span className="text-xs">•</span>
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>Criado em {new Date(entry.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </DialogDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveUp}
                disabled={entry.order_index === 0 || isLoading}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent p-2"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveDown}
                disabled={entry.order_index >= totalEntries - 1 || isLoading}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent p-2"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-slate-200">
                  Título da Entrada
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-slate-200">
                  Descrição
                </Label>
                <CharacterMentionInput
                  value={description}
                  onChange={setDescription}
                  adventureId={adventureId}
                  className="bg-slate-700/50 border-slate-600 text-white min-h-[120px]"
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
                disabled={isLoading || !title.trim()}
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
              {entry.description && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Descrição</h4>
                  <CharacterMentionDisplay
                    text={entry.description}
                    adventureId={adventureId}
                    className="text-sm text-slate-200 leading-relaxed"
                  />
                </div>
              )}
              {entry.updated_at !== entry.created_at && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>Atualizado em {new Date(entry.updated_at).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
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
