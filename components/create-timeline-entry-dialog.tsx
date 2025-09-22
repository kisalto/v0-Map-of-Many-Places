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
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { CharacterMentionInput } from "@/components/character-mention-input"

interface CreateTimelineEntryDialogProps {
  adventureId: string
  children: React.ReactNode
}

export function CreateTimelineEntryDialog({ adventureId, children }: CreateTimelineEntryDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Creating timeline entry:", { adventureId, title, description })
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Get current entries count for order_index
      const { count } = await supabase
        .from("timeline_entries")
        .select("*", { count: "exact", head: true })
        .eq("adventure_id", adventureId)

      console.log("[v0] Current entries count:", count)

      // Create timeline entry
      const { data: newEntry, error: insertError } = await supabase
        .from("timeline_entries")
        .insert({
          adventure_id: adventureId,
          creator_id: user.id, // Add creator_id field
          title: title.trim(),
          description: description.trim() || null,
          order_index: count || 0,
          position_x: 500 + (count || 0) * 200,
          position_y: 300 + (count || 0) * 100,
        })
        .select()
        .single()

      if (insertError) throw insertError

      console.log("[v0] Timeline entry created:", newEntry)

      // Parse mentions and create character_mentions records
      if (description.trim()) {
        await saveMentions(newEntry.id, description.trim())
      }

      // Reset form and close dialog
      setTitle("")
      setDescription("")
      setOpen(false)

      window.location.reload()
    } catch (error: unknown) {
      console.error("[v0] Error creating timeline entry:", error)
      setError(error instanceof Error ? error.message : "Erro ao criar entrada")
    } finally {
      setIsLoading(false)
    }
  }

  const saveMentions = async (entryId: string, text: string) => {
    const supabase = createClient()

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Nova Entrada da Timeline</DialogTitle>
          <DialogDescription className="text-slate-300">
            Adicione um novo momento ou evento à sua aventura. Use @ para mencionar personagens.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-slate-200">
                Título da Entrada
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Encontro com o Dragão"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
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
                placeholder="Descreva o que aconteceu... Use @nome para mencionar personagens"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[120px]"
              />
              <p className="text-xs text-slate-400">
                Dica: Digite @ seguido do nome de um personagem para criar uma menção interativa
              </p>
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
              onClick={() => setOpen(false)}
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
              Criar Entrada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
