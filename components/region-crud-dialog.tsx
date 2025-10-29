"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/image-upload"
import { X, Link2, RefreshCw } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Region {
  id: string
  name: string
  description: string | null
  history: string | null
  image_url: string | null
}

interface Subregion {
  id: string
  name: string
  description: string | null
}

interface Mention {
  id: string
  task_id: string
  region_name: string
  created_at: string
  task?: {
    id: string
    title: string
    created_at: string
  }
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
  const [description, setDescription] = useState("")
  const [history, setHistory] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [subregions, setSubregions] = useState<Subregion[]>([])
  const [newSubregionName, setNewSubregionName] = useState("")
  const [newSubregionDesc, setNewSubregionDesc] = useState("")
  const [saving, setSaving] = useState(false)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [loadingMentions, setLoadingMentions] = useState(false)

  useEffect(() => {
    if (region) {
      setName(region.name)
      setDescription(region.description || "")
      setHistory(region.history || "")
      setImageUrl(region.image_url || "")
      loadSubregions(region.id)
      loadMentions(region.id)
    } else {
      setName("")
      setDescription("")
      setHistory("")
      setImageUrl("")
      setSubregions([])
      setMentions([])
    }
  }, [region, open])

  const loadSubregions = async (regionId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from("subregions").select("*").eq("region_id", regionId).order("created_at")
    setSubregions(data || [])
  }

  const loadMentions = async (regionId: string) => {
    setLoadingMentions(true)
    try {
      const supabase = createClient()

      console.log("[v0] ========== LOADING REGION MENTIONS ==========")
      console.log("[v0] Region ID:", regionId)

      const { data: regionData } = await supabase.from("regions").select("name").eq("id", regionId).single()

      if (!regionData) {
        console.log("[v0] Region not found")
        setMentions([])
        setLoadingMentions(false)
        return
      }

      console.log("[v0] Region name:", regionData.name)

      const { data: mentionsData, error } = await supabase
        .from("region_mentions")
        .select("id, task_id, region_name, created_at")
        .eq("region_name", regionData.name)
        .order("created_at", { ascending: false })

      console.log("[v0] Region mentions query result:")
      console.log("  - Data:", mentionsData)
      console.log("  - Error:", error)
      console.log("  - Count:", mentionsData?.length || 0)

      if (mentionsData && mentionsData.length > 0) {
        const taskIds = mentionsData.map((m) => m.task_id).filter(Boolean)

        console.log("[v0] Task IDs from mentions:", taskIds)

        if (taskIds.length > 0) {
          const { data: tasksData } = await supabase.from("tasks").select("id, title, created_at").in("id", taskIds)

          console.log("[v0] Tasks data for region mentions:", tasksData)

          const mentionsWithTasks = mentionsData.map((mention) => ({
            ...mention,
            task: tasksData?.find((t) => t.id === mention.task_id),
          }))

          setMentions(mentionsWithTasks)
        } else {
          setMentions([])
        }
      } else {
        console.log("[v0] No mentions found for this region")
        setMentions([])
      }
      console.log("[v0] ========== END LOADING REGION MENTIONS ==========")
    } catch (error) {
      console.error("[v0] Error loading region mentions:", error)
    } finally {
      setLoadingMentions(false)
    }
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
        description: description.trim() || null,
        history: history.trim() || null,
        image_url: imageUrl.trim() || null,
      }

      console.log("[v0] Saving region with data:", data)

      let regionId: string

      if (region) {
        const { error } = await supabase.from("regions").update(data).eq("id", region.id)
        if (error) {
          console.error("[v0] Error updating region:", error)
          throw error
        }
        regionId = region.id

        const existingIds = subregions.filter((s) => !s.id.startsWith("temp-")).map((s) => s.id)
        if (existingIds.length > 0) {
          await supabase
            .from("subregions")
            .delete()
            .eq("region_id", regionId)
            .not("id", "in", `(${existingIds.join(",")})`)
        }
      } else {
        const { data: newRegion, error } = await supabase.from("regions").insert(data).select().single()
        if (error) {
          console.error("[v0] Error creating region:", error)
          throw error
        }
        console.log("[v0] Region created:", newRegion)
        if (!newRegion) {
          throw new Error("Failed to create region - no data returned")
        }
        regionId = newRegion.id
      }

      const newSubregions = subregions
        .filter((s) => s.id.startsWith("temp-"))
        .map((s) => ({
          region_id: regionId,
          name: s.name,
          description: s.description,
        }))

      if (newSubregions.length > 0) {
        const { error: subError } = await supabase.from("subregions").insert(newSubregions)
        if (subError) {
          console.error("[v0] Error creating subregions:", subError)
        }
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving region:", error)
      alert("Erro ao salvar região. Verifique o console para mais detalhes.")
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
          <div className="space-y-2">
            <Label className="text-[#E7D1B1]">Imagem da Região</Label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} onRemove={() => setImageUrl("")} />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#E7D1B1]">
              Descrição Curta
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Vila no domínio de Barovia"
              className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="history" className="text-[#E7D1B1]">
              História
            </Label>
            <Textarea
              id="history"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="Conte a história desta região..."
              rows={6}
              className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475] resize-none"
            />
          </div>

          {region && (
            <>
              <Separator className="bg-[#302831]" />
              <div className="space-y-3">
                <Label className="text-[#E7D1B1]">Regiões Internas</Label>

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
                    Adicionar Região Interna
                  </Button>
                </div>
              </div>

              <Separator className="bg-[#302831]" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-[#A78BFA]" />
                    <Label className="text-[#E7D1B1]">Citações</Label>
                  </div>
                  <Button
                    onClick={() => loadMentions(region.id)}
                    variant="ghost"
                    size="sm"
                    className="text-[#A78BFA] hover:text-[#A78BFA]/80 hover:bg-[#A78BFA]/10"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Recarregar
                  </Button>
                </div>

                {loadingMentions ? (
                  <p className="text-[#9F8475] text-sm">Carregando citações...</p>
                ) : mentions.length > 0 ? (
                  <div className="space-y-2">
                    {mentions.map((mention) => (
                      <div
                        key={mention.id}
                        className="p-3 bg-[#0B0A13] rounded-lg border border-[#302831] hover:border-[#A78BFA]/30 transition-colors"
                      >
                        <p className="text-[#E7D1B1] font-medium text-sm">
                          {mention.task?.title || "Anotação sem título"}
                        </p>
                        <p className="text-[#A78BFA] text-xs mt-1">#{mention.region_name}</p>
                        <p className="text-[#9F8475] text-xs mt-1">
                          {new Date(mention.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[#9F8475] text-sm">Nenhuma citação encontrada.</p>
                    <p className="text-[#9F8475] text-xs">
                      Verifique o console do navegador (F12) para logs de debug detalhados.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
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
