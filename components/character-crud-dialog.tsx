"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/image-upload"

interface Character {
  id: string
  name: string
  short_description: string | null
  history: string | null
  image_url: string | null
}

interface CharacterCrudDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adventureId: string
  character?: Character | null
  onSuccess: () => void
}

export function CharacterCrudDialog({
  open,
  onOpenChange,
  adventureId,
  character,
  onSuccess,
}: CharacterCrudDialogProps) {
  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [history, setHistory] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && character) {
      setName(character.name)
      setShortDescription(character.short_description || "")
      setHistory(character.history || "")
      setImageUrl(character.image_url || "")
    } else if (open && !character) {
      setName("")
      setShortDescription("")
      setHistory("")
      setImageUrl("")
    }
  }, [character, open])

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Nome é obrigatório")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      const data = {
        adventure_id: adventureId,
        name: name.trim(),
        short_description: shortDescription.trim() || null,
        history: history.trim() || null,
        image_url: imageUrl.trim() || null,
      }

      if (character) {
        const { error } = await supabase.from("characters").update(data).eq("id", character.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("characters").insert(data)
        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving character:", error)
      alert("Erro ao salvar personagem")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Use theme-aware classes for dialog */}
      <DialogContent className="bg-card border-primary/30 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif text-2xl">
            {character ? "Editar Personagem" : "Novo Personagem"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {character ? "Atualize as informações do personagem" : "Adicione um novo personagem à sua campanha"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image URL */}
          <div className="space-y-2">
            <Label className="text-foreground">Imagem do Personagem</Label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} onRemove={() => setImageUrl("")} />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Nome <span className="text-enemy">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Strahd von Zarovich"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="short-description" className="text-foreground">
              Descrição Curta
            </Label>
            <Input
              id="short-description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Ex: Vampiro, Senhor das trevas de Barovia"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* History */}
          <div className="space-y-2">
            <Label htmlFor="history" className="text-foreground">
              História
            </Label>
            <Textarea
              id="history"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="Conte a história deste personagem..."
              rows={6}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border-border text-foreground hover:bg-muted bg-transparent"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {saving ? "Salvando..." : character ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
