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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] ========== NewEntryPage MOUNTED ==========")
    console.log("[v0] Adventure ID:", adventureId)
    console.log("[v0] Chapter ID:", chapterId)
    console.log("[v0] Search params:", Object.fromEntries(searchParams.entries()))

    const loadData = async () => {
      const supabase = createClient()

      console.log("[v0] Fetching current user...")
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("[v0] Error fetching user:", userError)
      } else if (user) {
        console.log("[v0] Current user ID:", user.id)
        console.log("[v0] Current user email:", user.email)
        setCurrentUserId(user.id)
      } else {
        console.error("[v0] No user found - user is not authenticated")
      }

      // Load adventure
      console.log("[v0] Fetching adventure...")
      const { data, error } = await supabase.from("adventures").select("*").eq("id", adventureId).single()

      if (error) {
        console.error("[v0] Error fetching adventure:", error)
      } else {
        console.log("[v0] Adventure loaded:", data?.title)
        setAdventure(data)
      }
    }

    loadData()
  }, [adventureId, chapterId, searchParams])

  const handleSave = async () => {
    console.log("[v0] ========== SAVE NEW ENTRY START ==========")
    console.log("[v0] Current timestamp:", new Date().toISOString())

    if (!title || !title.trim()) {
      console.error("[v0] ❌ Validation failed: title is empty")
      alert("Por favor, insira um título para a anotação")
      return
    }

    if (!chapterId) {
      console.error("[v0] ❌ Validation failed: chapterId is missing")
      alert("Erro: Capítulo não identificado")
      return
    }

    if (!adventureId) {
      console.error("[v0] ❌ Validation failed: adventureId is missing")
      alert("Erro: Aventura não identificada")
      return
    }

    if (!currentUserId) {
      console.error("[v0] ❌ Validation failed: user is not authenticated")
      alert("Erro: Você precisa estar autenticado para criar anotações")
      return
    }

    console.log("[v0] ✅ Validation passed")
    console.log("[v0] Entry data to save:", {
      title: title.substring(0, 50) + (title.length > 50 ? "..." : ""),
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      chapterId,
      adventureId,
      currentUserId,
    })

    setSaving(true)
    const supabase = createClient()

    try {
      // Step 1: Get next order index
      console.log("[v0] STEP 1: Fetching existing tasks order...")
      const { data: existingTasks, error: fetchError } = await supabase
        .from("tasks")
        .select("order_index")
        .eq("chapter_id", chapterId)
        .order("order_index", { ascending: false })
        .limit(1)

      if (fetchError) {
        console.error("[v0] ❌ Error fetching existing tasks:", fetchError)
        throw fetchError
      }

      const nextOrderIndex = existingTasks && existingTasks.length > 0 ? existingTasks[0].order_index + 1 : 0
      console.log("[v0] ✅ Next order index calculated:", nextOrderIndex)
      console.log("[v0] Existing tasks count:", existingTasks?.length || 0)

      // Step 2: Create task
      console.log("[v0] STEP 2: Creating new task...")
      console.log("[v0] Task data:", {
        adventure_id: adventureId,
        chapter_id: chapterId,
        title: title.trim(),
        content_length: content.length,
        completed: false,
        order_index: nextOrderIndex,
      })

      const { data: newTask, error: taskError } = await supabase
        .from("tasks")
        .insert({
          adventure_id: adventureId,
          chapter_id: chapterId,
          title: title.trim(),
          content: content,
          completed: false,
          order_index: nextOrderIndex,
        })
        .select()
        .single()

      if (taskError) {
        console.error("[v0] ❌ Error creating task:", taskError)
        console.error("[v0] Task error code:", taskError.code)
        console.error("[v0] Task error details:", taskError.details)
        console.error("[v0] Task error hint:", taskError.hint)
        throw taskError
      }

      if (!newTask) {
        console.error("[v0] ❌ No task data returned from insert")
        throw new Error("Erro ao criar anotação: nenhum dado retornado")
      }

      console.log("[v0] ✅ Task created successfully!")
      console.log("[v0] New task ID:", newTask.id)
      console.log("[v0] New task data:", newTask)

      // Step 3: Create timeline entry
      console.log("[v0] STEP 3: Creating timeline entry...")
      console.log("[v0] Timeline entry data:", {
        adventure_id: adventureId,
        chapter_id: chapterId,
        title: title.trim(),
        content_length: content.length,
        is_task: true,
        order_index: nextOrderIndex,
        creator_id: currentUserId, // Using real user ID instead of empty UUID
      })

      const { data: timelineEntry, error: timelineError } = await supabase
        .from("timeline_entries")
        .insert({
          adventure_id: adventureId,
          chapter_id: chapterId,
          title: title.trim(),
          content: content,
          is_task: true,
          order_index: nextOrderIndex,
          creator_id: currentUserId, // Using real user ID
        })
        .select()
        .single()

      if (timelineError) {
        console.error("[v0] ❌ Error creating timeline_entry:", timelineError)
        console.error("[v0] Timeline error code:", timelineError.code)
        console.error("[v0] Timeline error details:", timelineError.details)
        console.error("[v0] Timeline error hint:", timelineError.hint)
        console.error("[v0] Timeline error message:", timelineError.message)
        throw timelineError
      }

      if (!timelineEntry) {
        console.error("[v0] ❌ No timeline entry data returned from insert")
        throw new Error("Erro ao criar entrada na timeline: nenhum dado retornado")
      }

      console.log("[v0] ✅ Timeline entry created successfully!")
      console.log("[v0] Timeline entry ID:", timelineEntry.id)
      console.log("[v0] Timeline entry data:", timelineEntry)

      // Step 4: Extract and process mentions
      console.log("[v0] STEP 4: Extracting mentions from content...")
      const characterMentions = content.match(/@[^\s@#]+/g) || []
      const regionMentions = content.match(/#[^\s@#]+/g) || []

      console.log("[v0] Mentions found:", {
        characterMentions: characterMentions,
        characterCount: characterMentions.length,
        regionMentions: regionMentions,
        regionCount: regionMentions.length,
      })

      // Step 5: Process character mentions
      if (characterMentions.length > 0) {
        console.log("[v0] STEP 5: Processing character mentions...")
        const characterNames = characterMentions.map((m) => m.slice(1))
        console.log("[v0] Character names to search:", characterNames)

        const { data: characters, error: charError } = await supabase
          .from("characters")
          .select("id, name, character_type")
          .eq("adventure_id", adventureId)
          .in("name", characterNames)

        if (charError) {
          console.error("[v0] ❌ Error fetching characters:", charError)
        } else {
          console.log("[v0] ✅ Characters found:", characters?.length || 0)
          console.log("[v0] Character details:", characters)

          if (characters && characters.length > 0) {
            const mentionsToInsert = characters.map((char) => ({
              timeline_entry_id: timelineEntry.id,
              task_id: newTask.id,
              character_id: char.id,
              mention_text: `@${char.name}`,
              character_type: char.character_type,
            }))

            console.log("[v0] Inserting character mentions:", mentionsToInsert.length)
            console.log("[v0] Character mentions data:", mentionsToInsert)

            const { error: insertError } = await supabase.from("character_mentions").insert(mentionsToInsert)

            if (insertError) {
              console.error("[v0] ❌ Error inserting character mentions:", insertError)
            } else {
              console.log("[v0] ✅ Character mentions saved successfully")
            }
          } else {
            console.log("[v0] ⚠️ No matching characters found in database")
          }
        }
      } else {
        console.log("[v0] No character mentions to process")
      }

      // Step 6: Process region mentions
      if (regionMentions.length > 0) {
        console.log("[v0] STEP 6: Processing region mentions...")
        const regionNames = regionMentions.map((m) => m.slice(1))
        console.log("[v0] Region names to search:", regionNames)

        const { data: regions, error: regError } = await supabase
          .from("regions")
          .select("id, name")
          .eq("adventure_id", adventureId)
          .in("name", regionNames)

        if (regError) {
          console.error("[v0] ❌ Error fetching regions:", regError)
        } else {
          console.log("[v0] ✅ Regions found:", regions?.length || 0)
          console.log("[v0] Region details:", regions)

          if (regions && regions.length > 0) {
            const mentionsToInsert = regions.map((region) => ({
              timeline_entry_id: timelineEntry.id,
              task_id: newTask.id,
              region_id: region.id,
              mention_text: `#${region.name}`,
            }))

            console.log("[v0] Inserting region mentions:", mentionsToInsert.length)
            console.log("[v0] Region mentions data:", mentionsToInsert)

            const { error: insertError } = await supabase.from("region_mentions").insert(mentionsToInsert)

            if (insertError) {
              console.error("[v0] ❌ Error inserting region mentions:", insertError)
            } else {
              console.log("[v0] ✅ Region mentions saved successfully")
            }
          } else {
            console.log("[v0] ⚠️ No matching regions found in database")
          }
        }
      } else {
        console.log("[v0] No region mentions to process")
      }

      // Success!
      console.log("[v0] ========== SAVE NEW ENTRY END (SUCCESS) ==========")
      console.log("[v0] Redirecting to adventure page...")
      setShowSaveConfirm(false)
      router.push(`/adventure/${adventureId}`)
      router.refresh()
    } catch (error) {
      console.error("[v0] ========== SAVE NEW ENTRY END (ERROR) ==========")
      console.error("[v0] Save error details:", error)
      console.error("[v0] Error type:", typeof error)
      console.error("[v0] Error constructor:", error?.constructor?.name)

      if (error && typeof error === "object" && "code" in error) {
        console.error("[v0] Error code:", (error as any).code)
        console.error("[v0] Error message:", (error as any).message)
        console.error("[v0] Error details:", (error as any).details)
        console.error("[v0] Error hint:", (error as any).hint)
      }

      alert("Erro ao salvar anotação: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setSaving(false)
      console.log("[v0] Save operation finished, saving state set to false")
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
              onClick={() => {
                console.log("[v0] Back button clicked, navigating to:", `/adventure/${adventureId}`)
                router.push(`/adventure/${adventureId}`)
              }}
              className="text-[#EE9B3A] hover:text-[#EE9B3A]/80 hover:bg-[#302831]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-[#302831]" />
            <h1 className="text-xl font-serif text-[#E7D1B1]">{adventure?.title || "Carregando..."}</h1>
          </div>
          <Button
            onClick={() => {
              console.log("[v0] Save button clicked")
              console.log("[v0] Title:", title)
              console.log("[v0] Content length:", content.length)
              console.log("[v0] Current user ID:", currentUserId)
              setShowSaveConfirm(true)
            }}
            disabled={!title.trim() || saving}
            className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13] font-medium"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Anotação"}
          </Button>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Title Input */}
          <Input
            value={title}
            onChange={(e) => {
              console.log("[v0] Title changed:", e.target.value)
              setTitle(e.target.value)
            }}
            placeholder="Título da anotação..."
            className="text-3xl font-serif border-none bg-transparent text-[#E7D1B1] placeholder:text-[#302831] focus-visible:ring-0 px-0"
          />

          {/* Rich Text Editor */}
          <RichTextEditor
            value={content}
            onChange={(newContent) => {
              console.log("[v0] Content changed, new length:", newContent.length)
              setContent(newContent)
            }}
            adventureId={adventureId}
          />

          {/* Help Text */}
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
        onOpenChange={(open) => {
          console.log("[v0] Save confirmation dialog state changed:", open)
          setShowSaveConfirm(open)
        }}
        title="Salvar Anotação?"
        description="Deseja salvar esta anotação? Ela será adicionada ao capítulo selecionado."
        confirmText="Salvar"
        cancelText="Cancelar"
        onConfirm={handleSave}
      />
    </div>
  )
}
