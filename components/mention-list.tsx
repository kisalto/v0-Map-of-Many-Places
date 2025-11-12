"use client"

import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, MapPin, Shield, Skull, User, Map } from "lucide-react"
import { cn } from "@/lib/utils"

interface MentionItem {
  id: string
  name: string
  label?: string
  type: "character" | "region" | "subregion"
  characterType?: "player" | "npc"
  category?: "ally" | "enemy" | "neutral"
  color?: string
  isSubRegion?: boolean
}

interface MentionListProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler()
        return true
      }

      if (event.key === "ArrowDown") {
        downHandler()
        return true
      }

      if (event.key === "Enter") {
        enterHandler()
        return true
      }

      return false
    },
  }))

  const getIcon = (item: MentionItem) => {
    if (item.type === "region") {
      return <Map className="h-4 w-4" />
    }

    if (item.type === "subregion") {
      return <MapPin className="h-4 w-4" />
    }

    if (item.characterType === "player") {
      return <Users className="h-4 w-4" />
    }

    if (item.category === "ally") {
      return <Shield className="h-4 w-4" />
    }

    if (item.category === "enemy") {
      return <Skull className="h-4 w-4" />
    }

    return <User className="h-4 w-4" />
  }

  const getColor = (item: MentionItem) => {
    if (item.color) {
      return `text-[${item.color}] bg-[${item.color}]/20`
    }

    if (item.type === "region") {
      return "text-purple-400 bg-purple-500/20"
    }

    if (item.type === "subregion") {
      return "text-pink-400 bg-pink-500/20"
    }

    if (item.characterType === "player") {
      return "text-green-400 bg-green-500/20"
    }

    if (item.category === "ally") {
      return "text-blue-400 bg-blue-500/20"
    }

    if (item.category === "enemy") {
      return "text-red-400 bg-red-500/20"
    }

    return "text-gray-400 bg-gray-500/20"
  }

  const getLabel = (item: MentionItem) => {
    if (item.type === "region") {
      return "Região"
    }

    if (item.type === "subregion") {
      return "Sub-região"
    }

    if (item.characterType === "player") {
      return "Jogador"
    }

    if (item.category === "ally") {
      return "Aliado"
    }

    if (item.category === "enemy") {
      return "Inimigo"
    }

    return "Neutro"
  }

  return (
    <Card className="w-64 bg-card border-primary/30 shadow-lg">
      <CardContent className="p-2">
        {props.items.length ? (
          <div className="space-y-1">
            {props.items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => selectItem(index)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
                  index === selectedIndex ? "bg-primary/20" : "hover:bg-primary/10",
                )}
              >
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", getColor(item))}>
                  {getIcon(item)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{item.label || item.name}</p>
                  <p className="text-xs text-muted-foreground">{getLabel(item)}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-2 text-sm text-muted-foreground">Nenhum resultado encontrado</div>
        )}
      </CardContent>
    </Card>
  )
})

MentionList.displayName = "MentionList"
