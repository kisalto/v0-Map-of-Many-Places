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
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface CreateAdventureDialogProps {
  children: React.ReactNode
}

export function CreateAdventureDialog({ children }: CreateAdventureDialogProps) {
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
      const supabase = createClient()

      console.log("[v0] Starting adventure creation...")

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Current user:", user?.id)

      if (!user) throw new Error("Usuário não autenticado")

      // Create adventure
      console.log("[v0] Attempting to insert adventure:", {
        title: title.trim(),
        description: description.trim() || null,
        creator_id: user.id,
      })

      const { data, error } = await supabase
        .from("adventures")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          creator_id: user.id,
        })
        .select()
        .single()

      console.log("[v0] Insert result:", { data, error })

      if (error) {
        console.error("[v0] Supabase error:", error)
        throw error
      }

      console.log("[v0] Adventure created successfully:", data)

      // Reset form and close dialog
      setTitle("")
      setDescription("")
      setOpen(false)

      // Refresh the page to show new adventure
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Error creating adventure:", error)
      setError(error instanceof Error ? error.message : "Erro ao criar aventura")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Nova Aventura</DialogTitle>
          <DialogDescription className="text-slate-300">
            Crie uma nova aventura para organizar sua campanha de RPG.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-slate-200">
                Título da Aventura
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: A Maldição do Dragão Ancião"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-slate-200">
                Descrição (opcional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva brevemente sua aventura..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
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
              disabled={isLoading || !title.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Aventura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
