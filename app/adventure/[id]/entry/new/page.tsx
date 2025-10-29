"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

export default function NewEntryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chapterId = searchParams.get("chapter")
  const adventureId = params.id

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [adventure, setAdventure] = useState<any>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)

  useEffect(() => {
    const loadAdventure = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("adventures").select("*").eq("id", adventureId).single()
      setAdventure(data)
    }
    loadAdventure()
  }, [adventureId])

  const handleSave = async () => {
    console.log("[v0] ========== SAVE NEW ENTRY START ==========")

    if (!title || !title.trim()) {
      console.error("[v0] Validation failed: title is empty")
      alert("Por favor, insira um título para a anotação")
      return
    }

    if (!chapterId) {
      console.error("[v0] Validation failed: chapterId is missing")
      alert("Erro: Capítulo não identificado")
      return
    }

    if (!adventureId) {
      console.error("[v0] Validation failed: adventureId is missing")
      alert("Erro: Aventura não identificada")
      return
    }

    console.log("[v0] Validation passed, saving entry...")
    console.log("[v0] Entry data:", {
      title: title.substring(0, 20) + "...",
      contentLength: content.length,
      chapterId,
      adventureId,
    })

    setSaving(true)
    const supabase = createClient()

    try {
      console.log("[v0] Fetching existing tasks order...")
      const { data: existingTasks, error: fetchError } = await supabase
        .from("tasks")
        .select("order_index")
        .eq("chapter_id", chapterId)
        .order("order_index", { ascending: false })
        .limit(1)

      if (fetchError) {
        console.error("[v0] Error fetching existing tasks:", fetchError)
        throw fetchError
      }

      const nextOrderIndex = existingTasks && existingTasks.length > 0 ? existingTasks[0].order_index + 1 : 0
      console.log("[v0] Next order index:", nextOrderIndex)

      console.log("[v0] Creating new task...")
      const { data: newTask, error: taskError } = await supabase
        .from("tasks")
        .insert({
          adventure_id: adventureId,
          chapter_id: chapterId,
          title: title.trim(),
          content: content,
          status: "pending",
          order_index: nextOrderIndex,
          completed: false,
        })
        .select()
        .single()

      if (taskError) {
        console.error("[v0] Error creating task:", taskError)
        throw taskError
      }

      if (!newTask) {
        console.error("[v0] No task data returned")
        throw new Error("Erro ao criar anotação")
      }

      console.log("[v0] Task created successfully:", newTask.id)

      console.log("[v0] Creating timeline entry...")
      const { data: timelineEntry, error: timelineError } = await supabase
        .from("timeline_entries")
        .insert({
          adventure_id: adventureId,
          chapter_id: chapterId,
          title: title.trim(),
          content: content,
          is_task: true,
          order_index: nextOrderIndex,
          creator_id: "00000000-0000-0000-0000-000000000000",
        })
        .select()
        .single()

      if (timelineError) {
        console.error("[v0] Error creating timeline_entry:", timelineError)
        throw timelineError
      }

      if (!timelineEntry) {
        console.error("[v0] No timeline entry data returned")
        throw new Error("Erro ao criar entrada na timeline")
      }

      console.log("[v0] Timeline entry created successfully:", timelineEntry.id)

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
              timeline_entry_id: timelineEntry.id,
              task_id: newTask.id,
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
              timeline_entry_id: timelineEntry.id,
              task_id: newTask.id,
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

      console.log("[v0] Entry saved successfully, redirecting...")
      setShowSaveConfirm(false)
      router.push(`/adventure/${adventureId}`)
      router.refresh()
      console.log("[v0] ========== SAVE NEW ENTRY END (SUCCESS) ==========")
    } catch (error) {
      console.error("[v0] ========== SAVE NEW ENTRY END (ERROR) ==========")
      console.error("[v0] Save error details:", error)
      alert("Erro ao salvar anotação: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0A13] text-white">
      {/* Header */}
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
          <Button
            onClick={() => setShowSaveConfirm(true)}
            disabled={!title.trim() || saving}
            className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13] font-medium"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Anotação
          </Button>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Title Input */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da anotação..."
            className="text-3xl font-serif border-none bg-transparent text-[#E7D1B1] placeholder:text-[#302831] focus-visible:ring-0 px-0"
          />

          {/* Rich Text Editor */}
          <RichTextEditor value={content} onChange={setContent} adventureId={adventureId} />

          {/* Help Text */}
          <div className="text-sm text-[#9F8475] space-y-1 pt-4 border-t border-[#302831]">
            <p>
              <strong className="text-[#EE9B3A]">Dica:</strong> Use @ para mencionar personagens (ex: @Strahd) e # para
              mencionar regiões (ex: #Barovia)
            </p>
            <p>As menções aparecerão destacadas no editor.</p>
          </div>
        </div>
      </main>

      <ConfirmationDialog
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        title="Salvar Anotação?"
        description="Deseja salvar esta anotação? Ela será adicionada ao capítulo selecionado."
        confirmText="Salvar"
        cancelText="Cancelar"
        onConfirm={handleSave}
      />
    </div>
  )
}
