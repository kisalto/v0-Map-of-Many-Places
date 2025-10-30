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
    console.log("[v0] RichTextEditor: Component mounted")
    console.log("[v0] RichTextEditor: Adventure ID:", adventureId)
    console.log("[v0] RichTextEditor: Initial value length:", value.length)

    const loadData = async () => {
      console.log("[v0] RichTextEditor: Loading characters and regions...")
      const supabase = createClient()

      const { data: charactersData, error: charError } = await supabase
        .from("characters")
        .select("id, name")
        .eq("adventure_id", adventureId)

      if (charError) {
        console.error("[v0] RichTextEditor: Error loading characters:", charError)
      } else {
        console.log("[v0] RichTextEditor: Characters loaded:", charactersData?.length || 0)
        console.log(
          "[v0] RichTextEditor: Character names:",
          charactersData?.map((c) => c.name),
        )
      }

      const { data: regionsData, error: regError } = await supabase
        .from("regions")
        .select("id, name")
        .eq("adventure_id", adventureId)

      if (regError) {
        console.error("[v0] RichTextEditor: Error loading regions:", regError)
      } else {
        console.log("[v0] RichTextEditor: Regions loaded:", regionsData?.length || 0)
        console.log(
          "[v0] RichTextEditor: Region names:",
          regionsData?.map((r) => r.name),
        )
      }

      const allCharacters: Character[] = (charactersData || []).map((char) => ({
        id: char.id,
        name: char.name,
        type: "character" as const,
      }))

      setCharacters(allCharacters)
      setRegions(regionsData || [])

      console.log("[v0] RichTextEditor: Data loaded successfully")
    }

    loadData()
  }, [adventureId, value.length])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      console.log("[v0] RichTextEditor: Input changed, new length:", newValue.length)

      onChange(newValue)

      const cursorPos = e.target.selectionStart
      const textBeforeCursor = newValue.slice(0, cursorPos)

      console.log("[v0] RichTextEditor: Cursor position:", cursorPos)
      console.log("[v0] RichTextEditor: Text before cursor:", textBeforeCursor.slice(-20))

      const lastAt = textBeforeCursor.lastIndexOf("@")
      const lastHash = textBeforeCursor.lastIndexOf("#")
      const lastMention = Math.max(lastAt, lastHash)

      console.log("[v0] RichTextEditor: Last @ position:", lastAt)
      console.log("[v0] RichTextEditor: Last # position:", lastHash)
      console.log("[v0] RichTextEditor: Last mention position:", lastMention)

      if (lastMention !== -1) {
        const textAfterMention = textBeforeCursor.slice(lastMention + 1)
        const hasSpace = textAfterMention.includes(" ")

        console.log("[v0] RichTextEditor: Text after mention:", textAfterMention)
        console.log("[v0] RichTextEditor: Has space:", hasSpace)

        if (!hasSpace) {
          const type = lastAt > lastHash ? "character" : "region"
          console.log("[v0] RichTextEditor: Mention type:", type)

          setMentionStart(lastMention)
          setMentionType(type)

          const query = textAfterMention.toLowerCase()
          console.log("[v0] RichTextEditor: Search query:", query)

          const filtered =
            type === "character"
              ? characters.filter((c) => c.name.toLowerCase().includes(query))
              : regions.filter((r) => r.name.toLowerCase().includes(query))

          console.log("[v0] RichTextEditor: Filtered results:", filtered.length)
          console.log(
            "[v0] RichTextEditor: Filtered items:",
            filtered.map((item) => item.name),
          )

          setSuggestions(filtered)
          setShowSuggestions(filtered.length > 0)
          setSelectedIndex(0)

          console.log("[v0] RichTextEditor: Show suggestions:", filtered.length > 0)
        } else {
          console.log("[v0] RichTextEditor: Hiding suggestions (space found)")
          setShowSuggestions(false)
        }
      } else {
        console.log("[v0] RichTextEditor: No mention trigger found")
        setShowSuggestions(false)
      }
    },
    [characters, regions, onChange],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return

    console.log("[v0] RichTextEditor: Key pressed:", e.key)

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => {
          const newIndex = (prev + 1) % suggestions.length
          console.log("[v0] RichTextEditor: Selected index (down):", newIndex)
          return newIndex
        })
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => {
          const newIndex = (prev - 1 + suggestions.length) % suggestions.length
          console.log("[v0] RichTextEditor: Selected index (up):", newIndex)
          return newIndex
        })
        break
      case "Enter":
      case "Tab":
        if (suggestions[selectedIndex]) {
          e.preventDefault()
          console.log("[v0] RichTextEditor: Inserting mention:", suggestions[selectedIndex].name)
          insertMention(suggestions[selectedIndex])
        }
        break
      case "Escape":
        console.log("[v0] RichTextEditor: Escape pressed, hiding suggestions")
        setShowSuggestions(false)
        break
    }
  }

  const insertMention = (item: Character | Region) => {
    console.log("[v0] RichTextEditor: Insert mention called")
    console.log("[v0] RichTextEditor: Item:", item)
    console.log("[v0] RichTextEditor: Mention start:", mentionStart)
    console.log("[v0] RichTextEditor: Mention type:", mentionType)

    if (!textareaRef.current) {
      console.error("[v0] RichTextEditor: Textarea ref is null!")
      return
    }

    const text = textareaRef.current.value
    const prefix = mentionType === "character" ? "@" : "#"
    const beforeMention = text.slice(0, mentionStart)
    const afterMention = text.slice(mentionStart + 1).replace(/^[^\s]*/, "")
    const newText = `${beforeMention}${prefix}${item.name} ${afterMention}`

    console.log("[v0] RichTextEditor: Before mention:", beforeMention.slice(-20))
    console.log("[v0] RichTextEditor: After mention:", afterMention.slice(0, 20))
    console.log("[v0] RichTextEditor: New text length:", newText.length)
    console.log("[v0] RichTextEditor: Mention inserted:", `${prefix}${item.name}`)

    onChange(newText)
    setShowSuggestions(false)

    setTimeout(() => {
      if (textareaRef.current) {
        const cursorPos = mentionStart + prefix.length + item.name.length + 1
        console.log("[v0] RichTextEditor: Setting cursor position:", cursorPos)
        textareaRef.current.setSelectionRange(cursorPos, cursorPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const applyFormat = (command: string) => {
    console.log("[v0] RichTextEditor: Apply format:", command)

    if (!textareaRef.current || disabled) {
      console.log("[v0] RichTextEditor: Cannot apply format (disabled or no ref)")
      return
    }

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selectedText = value.substring(start, end)

    console.log("[v0] RichTextEditor: Selection:", { start, end, selectedText })

    if (!selectedText) {
      console.log("[v0] RichTextEditor: No text selected")
      return
    }

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
    console.log("[v0] RichTextEditor: Formatted text:", formattedText)
    onChange(newValue)

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(start + wrapper.length, end + wrapper.length)
      }
    }, 0)
  }

  const insertList = (ordered: boolean) => {
    console.log("[v0] RichTextEditor: Insert list:", ordered ? "ordered" : "unordered")

    if (!textareaRef.current || disabled) {
      console.log("[v0] RichTextEditor: Cannot insert list (disabled or no ref)")
      return
    }

    const start = textareaRef.current.selectionStart
    const prefix = ordered ? "1. " : "- "
    const newValue = value.substring(0, start) + prefix + value.substring(start)

    console.log("[v0] RichTextEditor: List prefix:", prefix)
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
          onClick={() => {
            console.log("[v0] RichTextEditor: Bold button clicked")
            applyFormat("bold")
          }}
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
          onClick={() => {
            console.log("[v0] RichTextEditor: Italic button clicked")
            applyFormat("italic")
          }}
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
          onClick={() => {
            console.log("[v0] RichTextEditor: Underline button clicked")
            applyFormat("underline")
          }}
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
          onClick={() => {
            console.log("[v0] RichTextEditor: Unordered list button clicked")
            insertList(false)
          }}
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
          onClick={() => {
            console.log("[v0] RichTextEditor: Ordered list button clicked")
            insertList(true)
          }}
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
          className="w-full min-h-[500px] p-4 bg-[#0B0A13] border border-[#302831] rounded-lg text-transparent caret-[#E7D1B1] focus:outline-none focus:ring-2 focus:ring-[#EE9B3A]/50 leading-relaxed resize-none font-sans disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
          placeholder="Comece a escrever sua anotação... Use @ para mencionar personagens e # para mencionar regiões."
        />

        <div
          className="absolute top-0 left-0 w-full min-h-[500px] p-4 pointer-events-none whitespace-pre-wrap break-words leading-relaxed font-sans z-20"
          aria-hidden="true"
        >
          {renderColoredText(value)}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute z-[200] mt-1 w-64 bg-[#302831] border-[#EE9B3A]/30 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {suggestions.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      index === selectedIndex ? "bg-[#EE9B3A]/20" : "hover:bg-[#EE9B3A]/10"
                    }`}
                    onClick={() => {
                      console.log("[v0] RichTextEditor: Suggestion clicked:", item.name)
                      insertMention(item)
                    }}
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

  const mentionRegex = /(@[^@#\s]+)|(#[^@#\s]+)/g
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`} className="text-[#E7D1B1]">
          {text.slice(lastIndex, match.index)}
        </span>,
      )
    }

    const mention = match[0]
    const isCharacter = mention.startsWith("@")
    parts.push(
      <span
        key={`mention-${match.index}`}
        className={`${
          isCharacter
            ? "border border-[#60A5FA]/50 text-[#E7D1B1] rounded px-1"
            : "border border-[#A78BFA]/50 text-[#E7D1B1] rounded px-1"
        }`}
      >
        {mention}
      </span>,
    )

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="text-[#E7D1B1]">
        {text.slice(lastIndex)}
      </span>,
    )
  }

  return parts.length > 0 ? parts : <span className="text-[#E7D1B1]">{text}</span>
}
