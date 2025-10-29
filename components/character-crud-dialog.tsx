"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/image-upload"
import { Separator } from "@/components/ui/separator"
import { Link2 } from "lucide-react"

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
  const [mentions, setMentions] = useState<any[]>([])
  const [loadingMentions, setLoadingMentions] = useState(false)

  useEffect(() => {
    if (character) {
      setName(character.name)
      setShortDescription(character.short_description || "")
      setHistory(character.history || "")
      setImageUrl(character.image_url || "")
      loadMentions(character.id)
    } else {
      setName("")
      setShortDescription("")
      setHistory("")
      setImageUrl("")
      setMentions([])
    }
  }, [character, open])

  const loadMentions = async (characterId: string) => {
    setLoadingMentions(true)
    try {
      const supabase = createClient()

      console.log("[v0] Loading mentions for character ID:", characterId)

      const { data: mentionsData, error } = await supabase
        .from("character_mentions")
        .select("id, task_id, mention_text, created_at")
        .eq("character_id", characterId)
        .order("created_at", { ascending: false })

      console.log("[v0] Character mentions query result:", { mentionsData, error })

      if (error) {
        console.error("[v0] Error loading mentions:", error)
        setMentions([])
        return
      }

      if (mentionsData && mentionsData.length > 0) {
        const taskIds = mentionsData.map((m) => m.task_id).filter(Boolean)

        console.log("[v0] Task IDs from mentions:", taskIds)

        if (taskIds.length > 0) {
          const { data: tasksData, error: tasksError } = await supabase
            .from("tasks")
            .select("id, title, created_at")
            .in("id", taskIds)

          console.log("[v0] Tasks query result:", { tasksData, tasksError })

          const mentionsWithTasks = mentionsData.map((mention) => ({
            ...mention,
            task: tasksData?.find((t) => t.id === mention.task_id),
          }))

          console.log("[v0] Final mentions with tasks:", mentionsWithTasks)

          setMentions(mentionsWithTasks)
        } else {
          setMentions([])
        }
      } else {
        console.log("[v0] No mentions found for this character")
        setMentions([])
      }
    } catch (error) {
      console.error("[v0] Error loading mentions:", error)
      setMentions([])
    } finally {
      setLoadingMentions(false)
    }
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
            <Label className="text-[#E7D1B1]">Imagem do Personagem</Label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} onRemove={() => setImageUrl("")} />
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

          {/* Mentions Section */}
          {character && (
            <>
              <Separator className="bg-[#302831]" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#60A5FA]" />
                  <Label className="text-[#E7D1B1]">Aparições</Label>
                </div>

                {loadingMentions ? (
                  <p className="text-[#9F8475] text-sm">Carregando aparições...</p>
                ) : mentions.length > 0 ? (
                  <div className="space-y-2">
                    {mentions.map((mention) => (
                      <div
                        key={mention.id}
                        className="p-3 bg-[#0B0A13] rounded-lg border border-[#302831] hover:border-[#60A5FA]/30 transition-colors"
                      >
                        <p className="text-[#E7D1B1] font-medium text-sm">
                          {mention.task?.title || "Anotação sem título"}
                        </p>
                        <p className="text-[#60A5FA] text-xs mt-1">@{mention.mention_text}</p>
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
                  <p className="text-[#9F8475] text-sm">Nenhuma aparição registrada.</p>
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
            {saving ? "Salvando..." : character ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
