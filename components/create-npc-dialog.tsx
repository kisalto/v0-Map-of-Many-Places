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

interface CreateNPCDialogProps {
  adventureId: string
  children: React.ReactNode
}

export function CreateNPCDialog({ adventureId, children }: CreateNPCDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"alive" | "dead" | "unknown">("alive")
  const [characterCategory, setCharacterCategory] = useState<"ally" | "enemy" | "neutral">("neutral")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("npcs").insert({
        adventure_id: adventureId,
        name: name.trim(),
        description: description.trim() || null,
        status,
        character_category: characterCategory,
        notes: notes.trim() || null,
      })

      if (error) throw error

      setName("")
      setDescription("")
      setStatus("alive")
      setCharacterCategory("neutral")
      setNotes("")
      setOpen(false)

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao criar NPC")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-primary/30 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle>Novo NPC</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Adicione um novo personagem não-jogador à aventura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do NPC</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gandalf, o Cinzento"
                className="bg-input border-primary/30 text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a aparência e personalidade do NPC..."
                className="bg-input border-primary/30 text-foreground placeholder:text-muted-foreground min-h-[80px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="characterCategory">Categoria</Label>
              <Select
                value={characterCategory}
                onValueChange={(value: "ally" | "enemy" | "neutral") => setCharacterCategory(value)}
              >
                <SelectTrigger className="bg-input border-primary/30 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/30">
                  <SelectItem value="ally" className="text-foreground hover:bg-muted">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[var(--ally-color)]"></span>
                      Aliado
                    </span>
                  </SelectItem>
                  <SelectItem value="enemy" className="text-foreground hover:bg-muted">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[var(--enemy-color)]"></span>
                      Inimigo
                    </span>
                  </SelectItem>
                  <SelectItem value="neutral" className="text-foreground hover:bg-muted">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[var(--neutral-color)]"></span>
                      Neutral
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: "alive" | "dead" | "unknown") => setStatus(value)}>
                <SelectTrigger className="bg-input border-primary/30 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/30">
                  <SelectItem value="alive" className="text-foreground hover:bg-muted">
                    Vivo
                  </SelectItem>
                  <SelectItem value="dead" className="text-foreground hover:bg-muted">
                    Morto
                  </SelectItem>
                  <SelectItem value="unknown" className="text-foreground hover:bg-muted">
                    Desconhecido
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Anotações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações importantes sobre o NPC..."
                className="bg-input border-primary/30 text-foreground placeholder:text-muted-foreground min-h-[60px]"
              />
            </div>
            {error && (
              <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-md">
                <p className="text-sm text-destructive-foreground">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-primary/30 text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar NPC
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
