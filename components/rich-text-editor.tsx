"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"

interface Character {
  id: string
  name: string
  type: "npc" | "player"
}

interface Region {
  id: string
  name: string
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  adventureId: string
}

export function RichTextEditor({ value, onChange, adventureId }: RichTextEditorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<(Character | Region)[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionType, setMentionType] = useState<"character" | "region" | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [regions, setRegions] = useState<Region[]>([])

  // Load characters and regions
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      // Load NPCs
      const { data: npcs } = await supabase.from("npcs").select("id, name").eq("adventure_id", adventureId)

      // Load Players
      const { data: players } = await supabase
        .from("adventure_players")
        .select("id, character_name")
        .eq("adventure_id", adventureId)

      // Load Regions
      const { data: regionsData } = await supabase.from("regions").select("id, name").eq("adventure_id", adventureId)

      const allCharacters: Character[] = [
        ...(npcs || []).map((npc) => ({
          id: npc.id,
          name: npc.name,
          type: "npc" as const,
        })),
        ...(players || []).map((player) => ({
          id: player.id,
          name: player.character_name,
          type: "player" as const,
        })),
      ]

      setCharacters(allCharacters)
      setRegions(regionsData || [])
    }

    loadData()
  }, [adventureId])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || ""

    // Previne múltiplas chamadas do onChange
    if (text === value) return

    onChange(text)

    // Get cursor position
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const textBeforeCursor = range.startContainer.textContent?.slice(0, range.startOffset) || ""

    // Check for @ or # mention
    const lastAt = textBeforeCursor.lastIndexOf("@")
    const lastHash = textBeforeCursor.lastIndexOf("#")
    const lastMention = Math.max(lastAt, lastHash)

    if (lastMention !== -1) {
      const textAfterMention = textBeforeCursor.slice(lastMention + 1)
      const hasSpace = textAfterMention.includes(" ")

      if (!hasSpace) {
        const type = lastAt > lastHash ? "character" : "region"
        setMentionStart(lastMention)
        setMentionType(type)

        // Filter suggestions
        const query = textAfterMention.toLowerCase()
        const filtered =
          type === "character"
            ? characters.filter((c) => c.name.toLowerCase().includes(query))
            : regions.filter((r) => r.name.toLowerCase().includes(query))

        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
        setSelectedIndex(0)
      } else {
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case "Enter":
      case "Tab":
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        break
    }
  }

  const insertMention = (item: Character | Region) => {
    if (!editorRef.current) return

    const text = editorRef.current.textContent || ""
    const prefix = mentionType === "character" ? "@" : "#"
    const beforeMention = text.slice(0, mentionStart)
    const afterMention = text.slice(mentionStart + 1).replace(/^[^\s]*/, "")
    const newText = `${beforeMention}${prefix}${item.name} ${afterMention}`

    onChange(newText)
    setShowSuggestions(false)

    // Update editor content with highlighted mention
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.textContent = newText
        // Set cursor after mention
        const range = document.createRange()
        const sel = window.getSelection()
        const textNode = editorRef.current.firstChild
        if (textNode) {
          const cursorPos = mentionStart + item.name.length + 2
          range.setStart(textNode, Math.min(cursorPos, textNode.textContent?.length || 0))
          range.collapse(true)
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
      }
    }, 0)
  }

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[500px] p-4 bg-[#0B0A13] border border-[#302831] rounded-lg text-[#E7D1B1] focus:outline-none focus:ring-2 focus:ring-[#EE9B3A]/50 leading-relaxed"
        style={{ whiteSpace: "pre-wrap" }}
        suppressContentEditableWarning
      >
        {value}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 mt-1 w-64 bg-[#302831] border-[#EE9B3A]/30 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    index === selectedIndex ? "bg-[#EE9B3A]/20" : "hover:bg-[#EE9B3A]/10"
                  }`}
                  onClick={() => insertMention(item)}
                >
                  <div className="h-6 w-6 rounded-full bg-[#EE9B3A]/20 flex items-center justify-center text-[#EE9B3A] text-xs font-medium">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-[#E7D1B1]">{item.name}</span>
                  {"type" in item && (
                    <span className="ml-auto text-xs text-[#9F8475]">{item.type === "npc" ? "NPC" : "Jogador"}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
