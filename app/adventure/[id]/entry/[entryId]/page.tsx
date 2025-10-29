"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

export default function EditEntryPage({ params }: { params: { id: string; entryId: string } }) {
  const router = useRouter()
  const { id: adventureId, entryId } = params

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [adventure, setAdventure] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const { data: adventureData } = await supabase.from("adventures").select("*").eq("id", adventureId).single()
      setAdventure(adventureData)

      const { data: entryData } = await supabase.from("tasks").select("*").eq("id", entryId).single()

      if (entryData) {
        setTitle(entryData.title)
        setContent(entryData.content || "")
      }

      setLoading(false)
    }

    loadData()
  }, [adventureId, entryId])

  const handleSave = async () => {
    if (!title.trim()) return

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("tasks").update({ title: title.trim(), content: content }).eq("id", entryId)

      if (error) throw error

      const { data: taskData } = await supabase.from("tasks").select("timeline_entry_id").eq("id", entryId).single()
      const timelineEntryId = taskData?.timeline_entry_id || null

      await supabase.from("character_mentions").delete().eq("task_id", entryId)
      await supabase.from("region_mentions").delete().eq("task_id", entryId)

      const characterMentionNames = extractMentions(content, "character")
      console.log("[v0] Extracted character mentions:", characterMentionNames)

      if (characterMentionNames.length > 0) {
        const { data: characters } = await supabase
          .from("characters")
          .select("id, name")
          .eq("adventure_id", adventureId)
          .in("name", characterMentionNames)

        console.log("[v0] Found characters:", characters)

        if (characters && characters.length > 0) {
          const characterMentionsToInsert = characters.map((char) => ({
            task_id: entryId,
            timeline_entry_id: timelineEntryId,
            character_id: char.id,
            mention_text: char.name,
            character_type: "character",
          }))

          console.log("[v0] Inserting character mentions:", characterMentionsToInsert)

          const { error: charError } = await supabase.from("character_mentions").insert(characterMentionsToInsert)

          if (charError) {
            console.error("[v0] Error inserting character mentions:", charError)
          }
        }
      }

      const regionMentionNames = extractMentions(content, "region")
      console.log("[v0] Extracted region mentions:", regionMentionNames)

      if (regionMentionNames.length > 0) {
        const { data: regions } = await supabase
          .from("regions")
          .select("id, name")
          .eq("adventure_id", adventureId)
          .in("name", regionMentionNames)

        console.log("[v0] Found regions:", regions)

        if (regions && regions.length > 0) {
          const regionMentionsToInsert = regions.map((region) => ({
            task_id: entryId,
            timeline_entry_id: timelineEntryId,
            region_id: region.id,
            mention_text: region.name,
          }))

          console.log("[v0] Inserting region mentions:", regionMentionsToInsert)

          const { error: regionError } = await supabase.from("region_mentions").insert(regionMentionsToInsert)

          if (regionError) {
            console.error("[v0] Error inserting region mentions:", regionError)
          }
        }
      }

      setShowSaveConfirm(false)
      router.push(`/adventure/${adventureId}`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving entry:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", entryId)

      if (error) throw error

      setShowDeleteConfirm(false)
      router.push(`/adventure/${adventureId}`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting entry:", error)
    } finally {
      setDeleting(false)
    }
  }

  const extractMentions = (text: string, type: "character" | "region"): string[] => {
    const prefix = type === "character" ? "@" : "#"
    const regex = new RegExp(`${prefix}[^@#\\n.!?,;:]+`, "g")
    const matches = text.match(regex)
    return matches ? [...new Set(matches.map((m) => m.slice(1).trim()))] : []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0A13] flex items-center justify-center">
        <p className="text-[#9F8475]">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0A13] text-white">
      <header className="border-b border-[#302831] bg-[#0B0A13]/95 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/adventure/${adventureId}`)}
              className="text-[#EE9B3A] hover:text-[#EE9B3A]/80 hover:bg-[#302831]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-[#302831]" />
            <h1 className="text-xl font-serif text-[#E7D1B1]">{adventure?.title || "Carregando..."}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
            <Button
              onClick={() => setShowSaveConfirm(true)}
              disabled={!title.trim() || saving}
              className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13] font-medium"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da anotação..."
            className="text-3xl font-serif border-none bg-transparent text-[#E7D1B1] placeholder:text-[#302831] focus-visible:ring-0 px-0"
          />

          <RichTextEditor value={content} onChange={setContent} adventureId={adventureId} />

          <div className="text-sm text-[#9F8475] space-y-1 pt-4 border-t border-[#302831]">
            <p>
              <strong className="text-[#EE9B3A]">Dica:</strong> Use @ para mencionar personagens (ex: @Strahd) e # para
              mencionar regiões (ex: #Barovia)
            </p>
            <p>As menções aparecerão destacadas e serão vinculadas automaticamente.</p>
          </div>
        </div>
      </main>

      <ConfirmationDialog
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        title="Salvar Alterações?"
        description="Deseja salvar as alterações feitas nesta anotação?"
        confirmText="Salvar"
        cancelText="Cancelar"
        onConfirm={handleSave}
      />

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Deletar Anotação?"
        description="Tem certeza que deseja deletar esta anotação? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
