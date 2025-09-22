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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface CreatePlayerDialogProps {
  adventureId: string
  children: React.ReactNode
}

export function CreatePlayerDialog({ adventureId, children }: CreatePlayerDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [characterName, setCharacterName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"active" | "inactive" | "dead">("active")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !characterName.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // First, find the user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim())
        .single()

      if (profileError || !profile) {
        throw new Error("Usuário não encontrado com este email")
      }

      // Create adventure player
      const { error } = await supabase.from("adventure_players").insert({
        adventure_id: adventureId,
        profile_id: profile.id,
        character_name: characterName.trim(),
        description: description.trim() || null,
        status,
        notes: notes.trim() || null,
      })

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este jogador já está nesta aventura")
        }
        throw error
      }

      // Reset form and close dialog
      setEmail("")
      setCharacterName("")
      setDescription("")
      setStatus("active")
      setNotes("")
      setOpen(false)

      // Refresh the page to show new player
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao convidar jogador")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Jogador</DialogTitle>
          <DialogDescription className="text-slate-300">
            Convide um jogador para participar desta aventura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-200">
                Email do Jogador
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jogador@email.com"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="characterName" className="text-slate-200">
                Nome do Personagem
              </Label>
              <Input
                id="characterName"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Ex: Aragorn, Filho de Arathorn"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-slate-200">
                Descrição do Personagem
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o personagem do jogador..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[80px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-slate-200">
                Status
              </Label>
              <Select value={status} onValueChange={(value: "active" | "inactive" | "dead") => setStatus(value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="active" className="text-white hover:bg-slate-700">
                    Ativo
                  </SelectItem>
                  <SelectItem value="inactive" className="text-white hover:bg-slate-700">
                    Inativo
                  </SelectItem>
                  <SelectItem value="dead" className="text-white hover:bg-slate-700">
                    Morto
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-slate-200">
                Anotações (opcional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações sobre o personagem..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[60px]"
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
              onClick={() => setOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !email.trim() || !characterName.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Convidar Jogador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
