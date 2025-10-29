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
    if (!title.trim() || !chapterId) return

    setSaving(true)
    const supabase = createClient()

    try {
      console.log("[v0] Saving entry with data:", { adventureId, chapterId, title, content })

      const { data: existingTasks } = await supabase
        .from("tasks")
        .select("order_index")
        .eq("chapter_id", chapterId)
        .order("order_index", { ascending: false })
        .limit(1)

      const nextOrderIndex = existingTasks && existingTasks.length > 0 ? existingTasks[0].order_index + 1 : 0

      const { data: entry, error } = await supabase
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

      if (error) {
        console.error("[v0] Error creating entry:", error)
        return
      }

      console.log("[v0] Entry created successfully:", entry)

      const characterMentions = extractMentions(content, "character")
      if (characterMentions.length > 0) {
        console.log("[v0] Saving character mentions:", characterMentions)
        await supabase.from("character_mentions").insert(
          characterMentions.map((name) => ({
            task_id: entry.id,
            mention_text: name,
            character_type: "npc",
          })),
        )
      }

      const regionMentions = extractMentions(content, "region")
      if (regionMentions.length > 0) {
        console.log("[v0] Saving region mentions:", regionMentions)
        await supabase.from("region_mentions").insert(
          regionMentions.map((name) => ({
            task_id: entry.id,
            mention_text: name,
          })),
        )
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

  const extractMentions = (text: string, type: "character" | "region"): string[] => {
    const prefix = type === "character" ? "@" : "#"
    const regex = new RegExp(`${prefix}([\\w\\s]+)(?=\\s|$|[.,!?])`, "g")
    const matches = text.match(regex)
    return matches ? [...new Set(matches.map((m) => m.slice(1).trim()))] : []
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
            <p>As menções aparecerão destacadas e serão vinculadas automaticamente.</p>
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
