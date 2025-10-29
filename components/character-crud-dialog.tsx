"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Upload } from "lucide-react"

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
    if (character) {
      setName(character.name)
      setShortDescription(character.short_description || "")
      setHistory(character.history || "")
      setImageUrl(character.image_url || "")
    } else {
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
        await supabase.from("characters").update(data).eq("id", character.id)
      } else {
        await supabase.from("characters").insert(data)
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
      <DialogContent className="bg-[#302831] border-[#EE9B3A]/30 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#E7D1B1] font-serif text-2xl">
            {character ? "Editar Personagem" : "Novo Personagem"}
          </DialogTitle>
          <DialogDescription className="text-[#9F8475]">
            {character ? "Atualize as informações do personagem" : "Adicione um novo personagem à sua campanha"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image-url" className="text-[#E7D1B1]">
              URL da Imagem
            </Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475]"
              />
              <Button
                type="button"
                variant="outline"
                className="border-[#EE9B3A]/30 text-[#EE9B3A] hover:bg-[#EE9B3A]/10 bg-transparent"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {imageUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-[#0B0A13]">
                <img src={imageUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#E7D1B1]">
              Nome <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Strahd von Zarovich"
              className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475]"
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="short-description" className="text-[#E7D1B1]">
              Descrição Curta
            </Label>
            <Input
              id="short-description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Ex: Vampiro, Senhor das trevas de Barovia"
              className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475]"
            />
          </div>

          {/* History */}
          <div className="space-y-2">
            <Label htmlFor="history" className="text-[#E7D1B1]">
              História
            </Label>
            <Textarea
              id="history"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="Conte a história deste personagem..."
              rows={6}
              className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#302831]">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border-[#302831] text-[#E7D1B1] hover:bg-[#302831] bg-transparent"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13]"
          >
            {saving ? "Salvando..." : character ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
