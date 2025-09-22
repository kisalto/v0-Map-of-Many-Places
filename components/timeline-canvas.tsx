"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ZoomIn, ZoomOut, RotateCcw, Scroll } from "lucide-react"
import { TimelineEntryDetailDialog } from "@/components/timeline-entry-detail-dialog"
import { createClient } from "@/lib/supabase/client"

interface TimelineEntry {
  id: string
  title: string
  description: string | null
  position_x: number
  position_y: number
  order_index: number
  created_at: string
  updated_at: string
  creator_id?: string
  profiles?: {
    display_name: string
  } | null
}

interface TimelineCanvasProps {
  adventureId: string
  entries: TimelineEntry[]
}

export function TimelineCanvas({ adventureId, entries: initialEntries }: TimelineCanvasProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>(initialEntries)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)

  useEffect(() => {
    const refreshEntries = async () => {
      console.log("[v0] Refreshing timeline entries for adventure:", adventureId)
      const supabase = createClient()

      const { data: timelineData, error: timelineError } = await supabase
        .from("timeline_entries")
        .select("id, title, description, position_x, position_y, order_index, created_at, updated_at")
        .eq("adventure_id", adventureId)
        .order("order_index", { ascending: true })

      if (timelineError) {
        console.error("[v0] Error fetching timeline entries:", timelineError)
        return
      }

      if (timelineData) {
        console.log("[v0] Timeline entries fetched:", timelineData.length, "entries")
        setEntries(timelineData)
      }
    }

    refreshEntries()
  }, [adventureId])

  useEffect(() => {
    setEntries(initialEntries)
  }, [initialEntries])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.3))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const timelineX = 400 // Posição X fixa para a linha principal vertical
  const startY = 150
  const entrySpacing = 180 // Espaçamento menor entre entradas
  const totalHeight = Math.max(800, startY + entries.length * entrySpacing + 200)

  const groupedEntries = entries.reduce(
    (groups, entry, index) => {
      const existingGroup = groups.find((group) => group.title === entry.title)
      if (existingGroup) {
        existingGroup.entries.push({ ...entry, originalIndex: index })
      } else {
        groups.push({
          title: entry.title,
          entries: [{ ...entry, originalIndex: index }],
        })
      }
      return groups
    },
    [] as Array<{ title: string; entries: Array<TimelineEntry & { originalIndex: number }> }>,
  )

  return (
    <div className="relative h-full bg-gradient-to-br from-amber-50/30 to-yellow-100/20 overflow-hidden parchment-texture">
      {/* Controles */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          className="border-amber-600/30 bg-amber-50/80 text-amber-800 hover:bg-amber-100/80"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          className="border-amber-600/30 bg-amber-50/80 text-amber-800 hover:bg-amber-100/80"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetView}
          className="border-amber-600/30 bg-amber-50/80 text-amber-800 hover:bg-amber-100/80"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ minWidth: 1000, minHeight: totalHeight }}
          >
            <line
              x1={timelineX}
              y1={startY}
              x2={timelineX}
              y2={startY + Math.max(400, groupedEntries.length * entrySpacing)}
              stroke="rgb(161 98 7)"
              strokeWidth="4"
              opacity="0.8"
              strokeDasharray="0"
            />

            <circle cx={timelineX} cy={startY} r="10" fill="rgb(161 98 7)" className="drop-shadow-lg" />

            <circle
              cx={timelineX}
              cy={startY + Math.max(400, groupedEntries.length * entrySpacing)}
              r="8"
              fill="rgb(161 98 7)"
              opacity="0.6"
            />

            {groupedEntries.map((group, groupIndex) => {
              const entryY = startY + (groupIndex + 1) * entrySpacing
              return (
                <line
                  key={`connection-${group.title}-${groupIndex}`}
                  x1={timelineX}
                  y1={entryY}
                  x2={timelineX + 100}
                  y2={entryY}
                  stroke="rgb(161 98 7)"
                  strokeWidth="2"
                  opacity="0.6"
                />
              )
            })}

            {groupedEntries.map((group, groupIndex) => {
              const entryY = startY + (groupIndex + 1) * entrySpacing
              return (
                <circle
                  key={`point-${group.title}-${groupIndex}`}
                  cx={timelineX}
                  cy={entryY}
                  r="6"
                  fill="rgb(34 197 94)"
                  className="drop-shadow-md"
                />
              )
            })}
          </svg>

          {groupedEntries.map((group, groupIndex) => {
            const entryY = startY + (groupIndex + 1) * entrySpacing
            const entryX = timelineX + 100 + 20 // Posição à direita da linha de conexão

            return (
              <div
                key={`group-${group.title}-${groupIndex}`}
                className="absolute"
                style={{ left: entryX, top: entryY - 40 }}
              >
                <div className="flex flex-col gap-1">
                  {group.entries.map((entry, entryIndex) => (
                    <TimelineEntryDetailDialog
                      key={entry.id}
                      entry={entry}
                      adventureId={adventureId}
                      totalEntries={entries.length}
                    >
                      <Card
                        className={`w-48 h-20 bg-amber-50/90 border-amber-600/30 hover:bg-amber-100/90 transition-all cursor-pointer map-shadow ${
                          selectedEntry === entry.id ? "ring-2 ring-amber-600 shadow-lg shadow-amber-600/20" : ""
                        } ${entryIndex > 0 ? "ml-2" : ""}`}
                        style={{
                          transform:
                            entryIndex > 0
                              ? `translateY(-${entryIndex * 4}px) translateX(${entryIndex * 8}px)`
                              : undefined,
                          zIndex: group.entries.length - entryIndex,
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-amber-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <Scroll className="h-3 w-3 text-amber-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-amber-900 text-xs line-clamp-1 mb-1">{entry.title}</h3>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-amber-600/20 text-amber-800 text-xs px-1 py-0">
                                  #{entry.order_index + 1}
                                </Badge>
                                {group.entries.length > 1 && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-700/20 text-amber-900 text-xs px-1 py-0"
                                  >
                                    {entryIndex + 1}/{group.entries.length}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TimelineEntryDetailDialog>
                  ))}
                </div>
              </div>
            )
          })}

          <div
            className="absolute"
            style={{
              left: timelineX - 80,
              top: startY - 10,
            }}
          >
            <Badge variant="secondary" className="bg-amber-600/20 text-amber-800 border-amber-600/30">
              Início da Jornada
            </Badge>
          </div>

          <div
            className="absolute"
            style={{
              left: timelineX - 60,
              top: startY + Math.max(400, groupedEntries.length * entrySpacing) + 20,
            }}
          >
            <Badge variant="secondary" className="bg-amber-700/20 text-amber-900 border-amber-700/30">
              Presente
            </Badge>
          </div>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Scroll className="h-16 w-16 text-amber-600/60 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">Mapa Vazio</h3>
            <p className="text-amber-700/80 max-w-md">
              Comece sua jornada criando a primeira entrada no seu mapa. Use o botão "Nova Entrada" no cabeçalho.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
