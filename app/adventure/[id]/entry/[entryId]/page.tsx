"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WysiwygEditor } from "@/components/wysiwyg-editor"
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
    console.log("[v0] ========== SAVE EDIT ENTRY START ==========")

    if (!title || !title.trim()) {
      console.error("[v0] Validation failed: title is empty")
      alert("Por favor, insira um título para a anotação")
      return
    }

    if (!adventureId) {
      console.error("[v0] Validation failed: adventureId is missing")
      alert("Erro: Aventura não identificada")
      return
    }

    console.log("[v0] Validation passed, updating entry...")
    console.log("[v0] Entry data:", {
      entryId,
      title: title.substring(0, 20) + "...",
      contentLength: content.length,
      adventureId,
    })

    setSaving(true)
    const supabase = createClient()

    try {
      console.log("[v0] Updating task...")
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ title: title.trim(), content: content })
        .eq("id", entryId)

      if (taskError) {
        console.error("[v0] Error updating task:", taskError)
        throw taskError
      }

      console.log("[v0] Task updated successfully")

      console.log("[v0] Fetching task data for timeline entry...")
      const { data: taskData, error: taskFetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", entryId)
        .single()

      if (taskFetchError || !taskData) {
        console.error("[v0] Error fetching task data:", taskFetchError)
        throw taskFetchError || new Error("Task não encontrada")
      }

      console.log("[v0] Task data fetched:", { chapterId: taskData.chapter_id })

      console.log("[v0] Checking for existing timeline entry...")
      const { data: existingEntry, error: entryFetchError } = await supabase
        .from("timeline_entries")
        .select("id")
        .eq("chapter_id", taskData.chapter_id)
        .eq("title", title.trim())
        .eq("is_task", true)
        .maybeSingle()

      if (entryFetchError) {
        console.error("[v0] Error checking timeline entry:", entryFetchError)
      }

      let timelineEntryId = existingEntry?.id
      console.log("[v0] Existing timeline entry:", timelineEntryId || "none")

      if (!timelineEntryId) {
        console.log("[v0] Creating new timeline entry...")
        const { data: newEntry, error: entryError } = await supabase
          .from("timeline_entries")
          .insert({
            adventure_id: adventureId,
            chapter_id: taskData.chapter_id,
            title: title.trim(),
            content: content,
            is_task: true,
            order_index: taskData.order_index || 0,
            creator_id: "00000000-0000-0000-0000-000000000000",
          })
          .select()
          .single()

        if (entryError) {
          console.error("[v0] Error creating timeline entry:", entryError)
          throw entryError
        }

        if (!newEntry) {
          console.error("[v0] No timeline entry data returned")
          throw new Error("Erro ao criar entrada na timeline")
        }

        timelineEntryId = newEntry.id
        console.log("[v0] Timeline entry created:", timelineEntryId)
      } else {
        console.log("[v0] Updating existing timeline entry...")
        const { error: updateError } = await supabase
          .from("timeline_entries")
          .update({ title: title.trim(), content: content })
          .eq("id", timelineEntryId)

        if (updateError) {
          console.error("[v0] Error updating timeline entry:", updateError)
        } else {
          console.log("[v0] Timeline entry updated successfully")
        }
      }

      console.log("[v0] Deleting old mentions...")
      const { error: deleteCharError } = await supabase.from("character_mentions").delete().eq("task_id", entryId)
      const { error: deleteRegError } = await supabase.from("region_mentions").delete().eq("task_id", entryId)

      if (deleteCharError) console.error("[v0] Error deleting character mentions:", deleteCharError)
      if (deleteRegError) console.error("[v0] Error deleting region mentions:", deleteRegError)

      console.log("[v0] Old mentions deleted")

      console.log("[v0] Extracting mentions from content...")
      const characterMentions = content.match(/@[^\s@#]+/g) || []
      const regionMentions = content.match(/#[^\s@#]+/g) || []

      console.log("[v0] Found mentions:", {
        characters: characterMentions.length,
        regions: regionMentions.length,
      })

      if (characterMentions.length > 0) {
        console.log("[v0] Processing character mentions...")
        const characterNames = characterMentions.map((m) => m.slice(1))
        console.log("[v0] Character names:", characterNames)

        const { data: characters, error: charError } = await supabase
          .from("characters")
          .select("id, name")
          .eq("adventure_id", adventureId)
          .in("name", characterNames)

        if (charError) {
          console.error("[v0] Error fetching characters:", charError)
        } else {
          console.log("[v0] Found characters:", characters?.length || 0)

          if (characters && characters.length > 0) {
            const mentionsToInsert = characters.map((char) => ({
              timeline_entry_id: timelineEntryId,
              task_id: entryId,
              character_id: char.id,
              mention_text: `@${char.name}`,
            }))

            console.log("[v0] Inserting character mentions:", mentionsToInsert.length)
            const { error: insertError } = await supabase.from("character_mentions").insert(mentionsToInsert)

            if (insertError) {
              console.error("[v0] Error inserting character mentions:", insertError)
            } else {
              console.log("[v0] Character mentions saved successfully")
            }
          }
        }
      }

      if (regionMentions.length > 0) {
        console.log("[v0] Processing region mentions...")
        const regionNames = regionMentions.map((m) => m.slice(1))
        console.log("[v0] Region names:", regionNames)

        const { data: regions, error: regError } = await supabase
          .from("regions")
          .select("id, name")
          .eq("adventure_id", adventureId)
          .in("name", regionNames)

        if (regError) {
          console.error("[v0] Error fetching regions:", regError)
        } else {
          console.log("[v0] Found regions:", regions?.length || 0)

          if (regions && regions.length > 0) {
            const mentionsToInsert = regions.map((region) => ({
              timeline_entry_id: timelineEntryId,
              task_id: entryId,
              region_id: region.id,
              mention_text: `#${region.name}`,
            }))

            console.log("[v0] Inserting region mentions:", mentionsToInsert.length)
            const { error: insertError } = await supabase.from("region_mentions").insert(mentionsToInsert)

            if (insertError) {
              console.error("[v0] Error inserting region mentions:", insertError)
            } else {
              console.log("[v0] Region mentions saved successfully")
            }
          }
        }
      }

      console.log("[v0] Entry updated successfully, redirecting...")
      setShowSaveConfirm(false)
      router.push(`/adventure/${adventureId}`)
      router.refresh()
      console.log("[v0] ========== SAVE EDIT ENTRY END (SUCCESS) ==========")
    } catch (error) {
      console.error("[v0] ========== SAVE EDIT ENTRY END (ERROR) ==========")
      console.error("[v0] Save error details:", error)
      alert("Erro ao salvar alterações: " + (error instanceof Error ? error.message : "Erro desconhecido"))
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
      console.error("Error deleting entry:", error)
    } finally {
      setDeleting(false)
    }
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

          <WysiwygEditor value={content} onChange={setContent} adventureId={adventureId} />

          <div className="text-sm space-y-1 pt-4 border-t border-muted">
            <p className="text-muted-foreground">
              <strong className="text-primary">Dica:</strong> Use @ para mencionar personagens (ex: @Strahd) e # para
              mencionar regiões (ex: #Barovia)
            </p>
            <p className="text-muted-foreground">As menções aparecerão destacadas no editor.</p>
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
