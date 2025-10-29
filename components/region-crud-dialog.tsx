"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Upload, Plus, X } from "lucide-react"

interface Region {
  id: string
  name: string
  short_description: string | null
  history: string | null
  image_url: string | null
}

interface Subregion {
  id: string
  name: string
  description: string | null
}

interface RegionCrudDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adventureId: string
  region?: Region | null
  onSuccess: () => void
}

export function RegionCrudDialog({ open, onOpenChange, adventureId, region, onSuccess }: RegionCrudDialogProps) {
  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [history, setHistory] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [subregions, setSubregions] = useState<Subregion[]>([])
  const [newSubregionName, setNewSubregionName] = useState("")
  const [newSubregionDesc, setNewSubregionDesc] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (region) {
      setName(region.name)
      setShortDescription(region.short_description || "")
      setHistory(region.history || "")
      setImageUrl(region.image_url || "")
      loadSubregions(region.id)
    } else {
      setName("")
      setShortDescription("")
      setHistory("")
      setImageUrl("")
      setSubregions([])
    }
  }, [region, open])

  const loadSubregions = async (regionId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from("subregions").select("*").eq("region_id", regionId).order("created_at")
    setSubregions(data || [])
  }

  const handleAddSubregion = () => {
    if (!newSubregionName.trim()) return

    setSubregions([
      ...subregions,
      {
        id: `temp-${Date.now()}`,
        name: newSubregionName.trim(),
        description: newSubregionDesc.trim() || null,
      },
    ])
    setNewSubregionName("")
    setNewSubregionDesc("")
  }

  const handleRemoveSubregion = (id: string) => {
    setSubregions(subregions.filter((s) => s.id !== id))
  }

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

      let regionId: string

      if (region) {
        await supabase.from("regions").update(data).eq("id", region.id)
        regionId = region.id

        // Delete existing subregions that were removed
        const existingIds = subregions.filter((s) => !s.id.startsWith("temp-")).map((s) => s.id)
        await supabase
          .from("subregions")
          .delete()
          .eq("region_id", regionId)
          .not("id", "in", `(${existingIds.join(",")})`)
      } else {
        const { data: newRegion } = await supabase.from("regions").insert(data).select().single()
        regionId = newRegion!.id
      }

      // Insert new subregions
      const newSubregions = subregions
        .filter((s) => s.id.startsWith("temp-"))
        .map((s) => ({
          region_id: regionId,
          name: s.name,
          description: s.description,
        }))

      if (newSubregions.length > 0) {
        await supabase.from("subregions").insert(newSubregions)
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving region:", error)
      alert("Erro ao salvar região")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#302831] border-[#EE9B3A]/30 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#E7D1B1] font-serif text-2xl">
            {region ? "Editar Região" : "Nova Região"}
          </DialogTitle>
          <DialogDescription className="text-[#9F8475]">
            {region ? "Atualize as informações da região" : "Adicione uma nova região à sua campanha"}
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
              placeholder="Ex: Barovia"
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
              placeholder="Ex: Vila no domínio de Barovia"
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
              placeholder="Conte a história desta região..."
              rows={4}
              className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475] resize-none"
            />
          </div>

          {/* Subregions */}
          <div className="space-y-3 pt-4 border-t border-[#302831]">
            <Label className="text-[#E7D1B1]">Regiões Internas</Label>

            {/* Existing subregions */}
            {subregions.length > 0 && (
              <div className="space-y-2">
                {subregions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-start gap-2 p-3 bg-[#0B0A13] rounded-lg border border-[#302831]"
                  >
                    <div className="flex-1">
                      <p className="text-[#E7D1B1] font-medium">{sub.name}</p>
                      {sub.description && <p className="text-[#9F8475] text-sm mt-1">{sub.description}</p>}
                    </div>
                    <Button
                      onClick={() => handleRemoveSubregion(sub.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new subregion */}
            <div className="space-y-2 p-3 bg-[#0B0A13] rounded-lg border border-[#302831]">
              <Input
                value={newSubregionName}
                onChange={(e) => setNewSubregionName(e.target.value)}
                placeholder="Nome da região interna"
                className="bg-[#302831] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475]"
              />
              <Input
                value={newSubregionDesc}
                onChange={(e) => setNewSubregionDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="bg-[#302831] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475]"
              />
              <Button
                onClick={handleAddSubregion}
                disabled={!newSubregionName.trim()}
                variant="outline"
                size="sm"
                className="w-full border-[#EE9B3A]/30 text-[#EE9B3A] hover:bg-[#EE9B3A]/10 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Região Interna
              </Button>
            </div>
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
            {saving ? "Salvando..." : region ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
