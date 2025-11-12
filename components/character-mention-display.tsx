"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Crown, Sword, Users, Swords, Ban } from "lucide-react"
import { CharacterDetailDialog } from "@/components/character-detail-dialog"

interface Character {
  id: string
  name: string
  type: "npc" | "player"
  character_category?: "ally" | "enemy" | "neutral"
  status: string
  description?: string
  notes?: string
  created_at: string
  profiles?: {
    display_name: string
  } | null
}

interface CharacterMentionDisplayProps {
  text: string
  adventureId: string
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

export function CharacterMentionDisplay({ text, adventureId, className }: CharacterMentionDisplayProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [hoveredCharacter, setHoveredCharacter] = useState<Character | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })

  // Load characters when component mounts
  useEffect(() => {
    const loadCharacters = async () => {
      const supabase = createClient()

      const { data: npcs } = await supabase
        .from("npcs")
        .select("id, name, status, character_category, description, notes, created_at")
        .eq("adventure_id", adventureId)

      const { data: players } = await supabase
        .from("adventure_players")
        .select(
          "id, character_name, status, character_category, description, notes, created_at, profiles(display_name)",
        )
        .eq("adventure_id", adventureId)

      const allCharacters: Character[] = [
        ...(npcs || []).map((npc) => ({
          id: npc.id,
          name: npc.name,
          type: "npc" as const,
          character_category: npc.character_category as "ally" | "enemy" | "neutral" | undefined,
          status: npc.status,
          description: npc.description,
          notes: npc.notes,
          created_at: npc.created_at,
        })),
        ...(players || []).map((player) => ({
          id: player.id,
          name: player.character_name,
          type: "player" as const,
          character_category: player.character_category as "ally" | "enemy" | "neutral" | undefined,
          status: player.status,
          description: player.description,
          notes: player.notes,
          created_at: player.created_at,
          profiles: player.profiles,
        })),
      ]

      setCharacters(allCharacters)
    }

    loadCharacters()
  }, [adventureId])

  // Parse text and create clickable mentions
  const parseTextWithMentions = (text: string) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        })
      }

      // Find character by name
      const mentionName = match[1]
      const character = characters.find((char) => char.name.toLowerCase() === mentionName.toLowerCase())

      if (character) {
        parts.push({
          type: "mention",
          content: `@${character.name}`,
          character,
        })
      } else {
        // If character not found, treat as regular text
        parts.push({
          type: "text",
          content: match[0],
        })
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      })
    }

    return parts
  }

  const handleMentionHover = (character: Character, event: React.MouseEvent) => {
    setHoveredCharacter(character)
    setHoverPosition({ x: event.clientX, y: event.clientY })
  }

  const handleMentionLeave = () => {
    setHoveredCharacter(null)
  }

  const parts = parseTextWithMentions(text)

  return (
    <>
      <div className={className}>
        {parts.map((part, index) => {
          if (part.type === "mention" && part.character) {
            const color = getCharacterColor(part.character.type, part.character.character_category)
            const icon = getCharacterIcon(part.character.type, part.character.character_category)

            return (
              <CharacterDetailDialog key={index} character={part.character} type={part.character.type}>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-all hover:scale-105 font-medium border"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                    color: color,
                    borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                  }}
                  onMouseEnter={(e) => handleMentionHover(part.character!, e)}
                  onMouseLeave={handleMentionLeave}
                >
                  {icon}
                  {part.content}
                </span>
              </CharacterDetailDialog>
            )
          }
          return <span key={index}>{part.content}</span>
        })}
      </div>

      {/* Character hover card */}
      {hoveredCharacter && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: hoverPosition.x + 10,
            top: hoverPosition.y - 10,
          }}
        >
          <Card className="bg-card border-primary/30 shadow-xl w-64">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 bg-muted">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {hoveredCharacter.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-foreground text-sm">{hoveredCharacter.name}</h4>
                    <div className="flex items-center gap-1">
                      {getCharacterIcon(hoveredCharacter.type, hoveredCharacter.character_category)}
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${getCharacterColor(hoveredCharacter.type, hoveredCharacter.character_category)} 20%, transparent)`,
                          color: getCharacterColor(hoveredCharacter.type, hoveredCharacter.character_category),
                        }}
                      >
                        {hoveredCharacter.type === "player"
                          ? "Jogador"
                          : hoveredCharacter.character_category === "ally"
                            ? "Aliado"
                            : hoveredCharacter.character_category === "enemy"
                              ? "Inimigo"
                              : "Neutral"}
                      </Badge>
                    </div>
                  </div>
                  {hoveredCharacter.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{hoveredCharacter.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
