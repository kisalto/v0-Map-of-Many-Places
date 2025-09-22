"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Crown, Sword } from "lucide-react"

interface Character {
  id: string
  name: string
  type: "npc" | "player"
  status: string
}

interface CharacterMentionInputProps {
  value: string
  onChange: (value: string) => void
  adventureId: string
  placeholder?: string
  className?: string
}

export function CharacterMentionInput({
  value,
  onChange,
  adventureId,
  placeholder,
  className,
}: CharacterMentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Character[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionQuery, setMentionQuery] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [characters, setCharacters] = useState<Character[]>([])

  // Load characters when component mounts
  useEffect(() => {
    const loadCharacters = async () => {
      const supabase = createClient()

      // Load NPCs
      const { data: npcs } = await supabase.from("npcs").select("id, name, status").eq("adventure_id", adventureId)

      // Load Players
      const { data: players } = await supabase
        .from("adventure_players")
        .select("id, character_name, status")
        .eq("adventure_id", adventureId)

      const allCharacters: Character[] = [
        ...(npcs || []).map((npc) => ({
          id: npc.id,
          name: npc.name,
          type: "npc" as const,
          status: npc.status,
        })),
        ...(players || []).map((player) => ({
          id: player.id,
          name: player.character_name,
          type: "player" as const,
          status: player.status,
        })),
      ]

      setCharacters(allCharacters)
    }

    loadCharacters()
  }, [adventureId])

  // Handle text changes and detect @ mentions
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart

    onChange(newValue)

    // Check for @ mention
    const textBeforeCursor = newValue.slice(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      const hasSpaceAfterAt = textAfterAt.includes(" ")

      if (!hasSpaceAfterAt) {
        setMentionStart(lastAtIndex)
        setMentionQuery(textAfterAt.toLowerCase())

        // Filter characters based on query
        const filtered = characters.filter((char) => char.name.toLowerCase().includes(textAfterAt.toLowerCase()))
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

  // Handle keyboard navigation
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

  // Insert mention into text
  const insertMention = (character: Character) => {
    const beforeMention = value.slice(0, mentionStart)
    const afterMention = value.slice(mentionStart + mentionQuery.length + 1)
    const newValue = `${beforeMention}@${character.name} ${afterMention}`

    onChange(newValue)
    setShowSuggestions(false)

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = mentionStart + character.name.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full bg-slate-800 border-slate-700 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((character, index) => (
                <div
                  key={character.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    index === selectedIndex ? "bg-slate-700" : "hover:bg-slate-700/50"
                  }`}
                  onClick={() => insertMention(character)}
                >
                  <Avatar className="h-6 w-6 bg-slate-600">
                    <AvatarFallback className="bg-slate-600 text-slate-300 text-xs">
                      {character.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white truncate">{character.name}</span>
                      <div className="flex items-center gap-1">
                        {character.type === "npc" ? (
                          <Crown className="h-3 w-3 text-amber-400" />
                        ) : (
                          <Sword className="h-3 w-3 text-emerald-400" />
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            character.status === "alive" || character.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : character.status === "dead"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {character.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-400">Use ↑↓ para navegar, Enter para selecionar, Esc para cancelar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
