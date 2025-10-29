"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save, Bug } from "lucide-react"
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
      console.log("[v0] ========== SAVING ENTRY ==========")
      console.log("[v0] Adventure ID:", adventureId)
      console.log("[v0] Chapter ID:", chapterId)
      console.log("[v0] Title:", title)
      console.log("[v0] Content:", content)

      const { data: allChars } = await supabase.from("characters").select("id, name").eq("adventure_id", adventureId)

      const { data: allRegions } = await supabase.from("regions").select("id, name").eq("adventure_id", adventureId)

      console.log("[v0] All available characters:", allChars)
      console.log("[v0] All available regions:", allRegions)

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
      const regionMentions = extractMentions(content, "region")

      console.log("[v0] Extracted character mentions:", characterMentions)
      console.log("[v0] Extracted region mentions:", regionMentions)

      if (characterMentions.length > 0) {
        console.log("[v0] Comparing extracted names with database:")
        characterMentions.forEach((mention) => {
          const found = allChars?.find((c) => c.name === mention)
          console.log(`[v0]   "${mention}" -> ${found ? `FOUND (ID: ${found.id})` : "NOT FOUND"}`)
          if (!found && allChars) {
            console.log(
              `[v0]   Available names:`,
              allChars.map((c) => `"${c.name}"`),
            )
          }
        })

        const mentionsToInsert = characterMentions.map((name) => ({
          task_id: entry.id,
          character_name: name,
        }))

        console.log("[v0] About to insert character mentions:")
        console.log("[v0] Data structure:", JSON.stringify(mentionsToInsert, null, 2))

        const { data: insertedMentions, error: mentionError } = await supabase
          .from("character_mentions")
          .insert(mentionsToInsert)
          .select()

        if (mentionError) {
          console.error("[v0] ❌ Error saving character mentions:")
          console.error("[v0] Error object:", JSON.stringify(mentionError, null, 2))
          console.error("[v0] Error message:", mentionError.message)
          console.error("[v0] Error details:", mentionError.details)
          console.error("[v0] Error hint:", mentionError.hint)
          console.error("[v0] Error code:", mentionError.code)
        } else {
          console.log("[v0] ✅ Character mentions saved successfully!")
          console.log("[v0] Inserted mentions:", insertedMentions)
        }
      }

      if (regionMentions.length > 0) {
        console.log("[v0] Comparing extracted region names with database:")
        regionMentions.forEach((mention) => {
          const found = allRegions?.find((r) => r.name === mention)
          console.log(`[v0]   "${mention}" -> ${found ? `FOUND (ID: ${found.id})` : "NOT FOUND"}`)
          if (!found && allRegions) {
            console.log(
              `[v0]   Available names:`,
              allRegions.map((r) => `"${r.name}"`),
            )
          }
        })

        const mentionsToInsert = regionMentions.map((name) => ({
          task_id: entry.id,
          region_name: name,
        }))

        console.log("[v0] About to insert region mentions:")
        console.log("[v0] Data structure:", JSON.stringify(mentionsToInsert, null, 2))

        const { data: insertedMentions, error: mentionError } = await supabase
          .from("region_mentions")
          .insert(mentionsToInsert)
          .select()

        if (mentionError) {
          console.error("[v0] ❌ Error saving region mentions:")
          console.error("[v0] Error object:", JSON.stringify(mentionError, null, 2))
          console.error("[v0] Error message:", mentionError.message)
          console.error("[v0] Error details:", mentionError.details)
          console.error("[v0] Error hint:", mentionError.hint)
          console.error("[v0] Error code:", mentionError.code)
        } else {
          console.log("[v0] ✅ Region mentions saved successfully!")
          console.log("[v0] Inserted mentions:", insertedMentions)
        }
      }

      console.log("[v0] ========== END SAVING ENTRY ==========")

      setShowSaveConfirm(false)
      router.push(`/adventure/${adventureId}`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Unexpected error saving entry:", error)
    } finally {
      setSaving(false)
    }
  }

  const extractMentions = (text: string, type: "character" | "region"): string[] => {
    const prefix = type === "character" ? "@" : "#"
    const regex = new RegExp(`${prefix === "@" ? "@" : "#"}[^@#\\n.!?,;:]+`, "g")
    const matches = text.match(regex)
    const extracted = matches ? [...new Set(matches.map((m) => m.slice(1).trim()))] : []

    console.log("[v0] ========== EXTRACTING MENTIONS ==========")
    console.log("[v0] Type:", type)
    console.log("[v0] Prefix:", prefix)
    console.log("[v0] Text:", text)
    console.log("[v0] Regex:", regex)
    console.log("[v0] Raw matches:", matches)
    console.log("[v0] Extracted (after slice and trim):", extracted)
    console.log("[v0] ========== END EXTRACTING MENTIONS ==========")

    return extracted
  }

  const testMentionExtraction = async () => {
    console.log("[v0] ========== TESTING MENTION EXTRACTION ==========")
    console.log("[v0] Current content:", content)

    const chars = extractMentions(content, "character")
    const regions = extractMentions(content, "region")

    console.log("[v0] Extracted characters:", chars)
    console.log("[v0] Extracted regions:", regions)

    // Buscar personagens e regiões disponíveis
    const supabase = createClient()
    const { data: allChars } = await supabase.from("characters").select("id, name").eq("adventure_id", adventureId)

    const { data: allRegions } = await supabase.from("regions").select("id, name").eq("adventure_id", adventureId)

    console.log("[v0] All available characters:", allChars)
    console.log("[v0] All available regions:", allRegions)

    console.log("[v0] Matching results:")
    chars.forEach((mention) => {
      const found = allChars?.find((c) => c.name === mention)
      console.log(`[v0]   Character "${mention}" -> ${found ? `✅ FOUND (ID: ${found.id})` : "❌ NOT FOUND"}`)
    })
    regions.forEach((mention) => {
      const found = allRegions?.find((r) => r.name === mention)
      console.log(`[v0]   Region "${mention}" -> ${found ? `✅ FOUND (ID: ${found.id})` : "❌ NOT FOUND"}`)
    })

    console.log("[v0] ========== END TEST ==========")
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
          <div className="flex items-center gap-2">
            <Button
              onClick={testMentionExtraction}
              variant="outline"
              size="sm"
              className="border-[#302831] text-[#9F8475] hover:bg-[#302831] bg-transparent"
            >
              <Bug className="h-4 w-4 mr-2" />
              Testar
            </Button>
            <Button
              onClick={() => setShowSaveConfirm(true)}
              disabled={!title.trim() || saving}
              className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13] font-medium"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Anotação
            </Button>
          </div>
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
            <p className="text-xs text-[#9F8475]/70 mt-2">
              💡 Clique no botão "Testar" no topo para verificar se as menções estão sendo detectadas corretamente (veja
              o console F12)
            </p>
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
