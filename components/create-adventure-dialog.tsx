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

      if (error) {
        console.error("[v0] Supabase error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          full: error,
        })
        throw new Error(error.message || "Erro ao criar aventura")
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
      <DialogContent className="bg-[#302831] border-[#EE9B3A]/30 text-[#E7D1B1]">
        <DialogHeader>
          <DialogTitle className="text-[#E7D1B1]">Nova Aventura</DialogTitle>
          <DialogDescription className="text-[#9F8475]">
            Crie uma nova aventura para organizar sua campanha de RPG.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-[#E7D1B1]">
                Título da Aventura
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: A Maldição do Dragão"
                className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475]"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-[#E7D1B1]">
                Descrição (opcional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva brevemente sua aventura..."
                className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475] min-h-[100px]"
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
              className="border-[#302831] text-[#E7D1B1] hover:bg-[#302831] bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13]"
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
