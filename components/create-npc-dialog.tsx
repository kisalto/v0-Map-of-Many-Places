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

      // Create NPC
      const { error } = await supabase.from("npcs").insert({
        adventure_id: adventureId,
        name: name.trim(),
        description: description.trim() || null,
        status,
        notes: notes.trim() || null,
      })

      if (error) throw error

      // Reset form and close dialog
      setName("")
      setDescription("")
      setStatus("alive")
      setNotes("")
      setOpen(false)

      // Refresh the page to show new NPC
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Novo NPC</DialogTitle>
          <DialogDescription className="text-slate-300">
            Adicione um novo personagem não-jogador à aventura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-slate-200">
                Nome do NPC
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gandalf, o Cinzento"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
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
                placeholder="Descreva a aparência e personalidade do NPC..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[80px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-slate-200">
                Status
              </Label>
              <Select value={status} onValueChange={(value: "alive" | "dead" | "unknown") => setStatus(value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="alive" className="text-white hover:bg-slate-700">
                    Vivo
                  </SelectItem>
                  <SelectItem value="dead" className="text-white hover:bg-slate-700">
                    Morto
                  </SelectItem>
                  <SelectItem value="unknown" className="text-white hover:bg-slate-700">
                    Desconhecido
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
                placeholder="Anotações importantes sobre o NPC..."
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
              disabled={isLoading || !name.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
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
