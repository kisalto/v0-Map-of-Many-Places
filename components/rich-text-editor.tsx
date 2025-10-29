"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react"

interface Character {
  id: string
  name: string
  type: "character"
}

interface Region {
  id: string
  name: string
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  adventureId: string
  disabled?: boolean
}

export function RichTextEditor({ value, onChange, adventureId, disabled = false }: RichTextEditorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<(Character | Region)[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionType, setMentionType] = useState<"character" | "region" | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [regions, setRegions] = useState<Region[]>([])

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const { data: charactersData } = await supabase
        .from("characters")
        .select("id, name")
        .eq("adventure_id", adventureId)

      const { data: regionsData } = await supabase.from("regions").select("id, name").eq("adventure_id", adventureId)

      console.log("[v0] Loaded characters for mentions:", charactersData)
      console.log("[v0] Loaded regions for mentions:", regionsData)

      const allCharacters: Character[] = (charactersData || []).map((char) => ({
        id: char.id,
        name: char.name,
        type: "character" as const,
      }))

      setCharacters(allCharacters)
      setRegions(regionsData || [])
    }

    loadData()
  }, [adventureId])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      onChange(newValue)

      const cursorPos = e.target.selectionStart
      const textBeforeCursor = newValue.slice(0, cursorPos)

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

          const query = textAfterMention.toLowerCase()
          const filtered =
            type === "character"
              ? characters.filter((c) => c.name.toLowerCase().includes(query))
              : regions.filter((r) => r.name.toLowerCase().includes(query))

          console.log("[v0] Mention detected:", { type, query, filtered })

          setSuggestions(filtered)
          setShowSuggestions(filtered.length > 0)
          setSelectedIndex(0)
        } else {
          setShowSuggestions(false)
        }
      } else {
        setShowSuggestions(false)
      }
    },
    [characters, regions, onChange],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        if (suggestions[selectedIndex]) {
          e.preventDefault()
          insertMention(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        break
    }
  }

  const insertMention = (item: Character | Region) => {
    if (!textareaRef.current) return

    const text = textareaRef.current.value
    const prefix = mentionType === "character" ? "@" : "#"
    const beforeMention = text.slice(0, mentionStart)
    const afterMention = text.slice(mentionStart + 1).replace(/^[^\s]*/, "")
    const newText = `${beforeMention}${prefix}${item.name} ${afterMention}`

    console.log("[v0] Inserting mention:", { item, newText })

    onChange(newText)
    setShowSuggestions(false)

    setTimeout(() => {
      if (textareaRef.current) {
        const cursorPos = mentionStart + item.name.length + 2
        textareaRef.current.setSelectionRange(cursorPos, cursorPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const applyFormat = (command: string) => {
    if (!textareaRef.current || disabled) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selectedText = value.substring(start, end)

    if (!selectedText) return

    let formattedText = selectedText
    let wrapper = ""

    switch (command) {
      case "bold":
        wrapper = "**"
        formattedText = `**${selectedText}**`
        break
      case "italic":
        wrapper = "*"
        formattedText = `*${selectedText}*`
        break
      case "underline":
        wrapper = "__"
        formattedText = `__${selectedText}__`
        break
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end)
    onChange(newValue)

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(start + wrapper.length, end + wrapper.length)
      }
    }, 0)
  }

  const insertList = (ordered: boolean) => {
    if (!textareaRef.current || disabled) return

    const start = textareaRef.current.selectionStart
    const prefix = ordered ? "1. " : "- "
    const newValue = value.substring(0, start) + prefix + value.substring(start)

    onChange(newValue)

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start + prefix.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  return (
    <div className="relative space-y-2">
      <div className="flex items-center gap-1 p-2 bg-[#302831] border border-[#EE9B3A]/30 rounded-lg">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormat("bold")}
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-[#EE9B3A]/20 hover:text-[#EE9B3A]"
          title="Negrito (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormat("italic")}
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-[#EE9B3A]/20 hover:text-[#EE9B3A]"
          title="Itálico (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormat("underline")}
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-[#EE9B3A]/20 hover:text-[#EE9B3A]"
          title="Sublinhado (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 bg-[#EE9B3A]/30" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertList(false)}
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-[#EE9B3A]/20 hover:text-[#EE9B3A]"
          title="Lista com marcadores"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertList(true)}
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-[#EE9B3A]/20 hover:text-[#EE9B3A]"
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 bg-[#EE9B3A]/30" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-[#EE9B3A]/20 hover:text-[#EE9B3A]"
          title="Alinhar à esquerda"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-[#EE9B3A]/20 hover:text-[#EE9B3A]"
          title="Centralizar"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-[#EE9B3A]/20 hover:text-[#EE9B3A]"
          title="Alinhar à direita"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-[#EE9B3A]/20 hover:text-[#EE9B3A]"
          title="Justificar"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          spellCheck={false}
          className="w-full min-h-[500px] p-4 bg-[#0B0A13] border border-[#302831] rounded-lg text-transparent caret-[#E7D1B1] focus:outline-none focus:ring-2 focus:ring-[#EE9B3A]/50 leading-relaxed resize-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Comece a escrever sua anotação... Use @ para mencionar personagens e # para mencionar regiões."
        />

        <div
          className="absolute top-0 left-0 w-full min-h-[500px] p-4 pointer-events-none whitespace-pre-wrap break-words leading-relaxed font-sans"
          aria-hidden="true"
        >
          {renderColoredText(value)}
        </div>

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
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        "type" in item ? "bg-[#60A5FA]/20 text-[#60A5FA]" : "bg-[#A78BFA]/20 text-[#A78BFA]"
                      }`}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-[#E7D1B1]">{item.name}</span>
                    {"type" in item && <span className="ml-auto text-xs text-[#9F8475]">Personagem</span>}
                    {!("type" in item) && <span className="ml-auto text-xs text-[#9F8475]">Região</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function renderColoredText(text: string) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  // Captures everything after @ or # until it finds: double space, punctuation, another mention, or end of line
  const mentionRegex = /(@[^@#\n]+?)(?=\s{2,}|[.!?,;:]|\s[@#]|$)|(#[^@#\n]+?)(?=\s{2,}|[.!?,;:]|\s[@#]|$)/g
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`} className="text-[#E7D1B1]">
          {text.slice(lastIndex, match.index)}
        </span>,
      )
    }

    // Add colored mention
    const mention = match[0].trim()
    const isCharacter = mention.startsWith("@")
    parts.push(
      <span key={`mention-${match.index}`} className={isCharacter ? "text-[#60A5FA]" : "text-[#A78BFA]"}>
        {mention}
      </span>,
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="text-[#E7D1B1]">
        {text.slice(lastIndex)}
      </span>,
    )
  }

  return parts.length > 0 ? parts : <span className="text-[#E7D1B1]">{text}</span>
}
