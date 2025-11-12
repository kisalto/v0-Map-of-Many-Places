"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Crown, Sword, Users, Swords, Ban } from "lucide-react"

interface Character {
  id: string
  name: string
  type: "npc" | "player"
  character_category?: "ally" | "enemy" | "neutral"
  status: string
}

interface CharacterMentionInputProps {
  value: string
  onChange: (value: string) => void
  adventureId: string
  placeholder?: string
  className?: string
}

const getCharacterColor = (type: "npc" | "player", category?: "ally" | "enemy" | "neutral") => {
  if (type === "player") return "var(--player-color)"
  if (category === "ally") return "var(--ally-color)"
  if (category === "enemy") return "var(--enemy-color)"
  return "var(--neutral-color)"
}

const getCharacterIcon = (type: "npc" | "player", category?: "ally" | "enemy" | "neutral") => {
  if (type === "player") return <Sword className="h-3 w-3" />
  if (category === "ally") return <Users className="h-3 w-3" />
  if (category === "enemy") return <Swords className="h-3 w-3" />
  if (category === "neutral") return <Ban className="h-3 w-3" />
  return <Crown className="h-3 w-3" />
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

      const { data: allChars, error } = await supabase
        .from("characters")
        .select("id, name, character_type, character_category")
        .eq("adventure_id", adventureId)

      if (error) {
        console.error("[v0] CharacterMentionInput: Error loading characters:", error)
        return
      }

      const allCharacters: Character[] = (allChars || []).map((char) => ({
        id: char.id,
        name: char.name,
        type: char.character_type as "npc" | "player",
        character_category: char.character_category as "ally" | "enemy" | "neutral" | undefined,
        status: "active",
      }))

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
        <Card className="absolute z-50 mt-1 w-full bg-card border-primary/30 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((character, index) => {
                const color = getCharacterColor(character.type, character.character_category)
                const icon = getCharacterIcon(character.type, character.character_category)

                return (
                  <div
                    key={character.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                    onClick={() => insertMention(character)}
                  >
                    <Avatar className="h-6 w-6 bg-muted">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {character.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground truncate">{character.name}</span>
                        <div className="flex items-center gap-1">
                          {icon}
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                              color: color,
                            }}
                          >
                            {character.type === "player"
                              ? "Jogador"
                              : character.character_category === "ally"
                                ? "Aliado"
                                : character.character_category === "enemy"
                                  ? "Inimigo"
                                  : "Neutral"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 pt-2 border-t border-primary/30">
              <p className="text-xs text-muted-foreground">
                Use ↑↓ para navegar, Enter para selecionar, Esc para cancelar
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
