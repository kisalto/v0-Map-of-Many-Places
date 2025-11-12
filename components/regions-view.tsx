"use client"

import { useState } from "react"
import { Search, Plus, Trash2, X, Edit2, Check, MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { RegionCrudDialog } from "@/components/region-crud-dialog"
import Link from "next/link"

interface Subregion {
  id: string
  name: string
  description: string | null
}

interface Region {
  id: string
  name: string
  short_description: string | null
  history: string | null
  image_url: string | null
}

interface Adventure {
  id: string
  title: string
  is_active?: boolean
}

interface RegionsViewProps {
  adventure: Adventure
  regions: Region[]
}

interface TimelineEntryMention {
  id: string
  title: string
  content: string | null
  created_at: string
  chapter_id: string | null
  task_id: string
}

export function RegionsView({ adventure, regions }: RegionsViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [mentions, setMentions] = useState<TimelineEntryMention[]>([])
  const [loadingMentions, setLoadingMentions] = useState(false)
  const [subregions, setSubregions] = useState<Subregion[]>([])
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const isActive = adventure.is_active !== false

  const filteredRegions = regions.filter((region) => region.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelectRegion = async (region: Region) => {
    console.log("[v0] Region selected:", region.name)
    setSelectedRegion(region)
    setMentions([])
    setLoadingMentions(true)

    const supabase = createClient()

    try {
      console.log("[v0] Fetching region mentions for region_id:", region.id)

      const { data: mentionsData, error: mentionsError } = await supabase
        .from("region_mentions")
        .select(
          `
          timeline_entry_id,
          task_id,
          timeline_entries (
            id,
            title,
            content,
            created_at,
            chapter_id
          )
        `,
        )
        .eq("region_id", region.id)

      if (mentionsError) {
        console.error("[v0] Error fetching region mentions:", mentionsError)
      } else {
        console.log("[v0] Region mentions found:", mentionsData?.length || 0)

        const timelineEntries = (mentionsData || [])
          .map((mention: any) => {
            if (mention.timeline_entries) {
              return {
                ...mention.timeline_entries,
                task_id: mention.task_id,
              }
            }
            return null
          })
          .filter((entry: any) => entry !== null) as TimelineEntryMention[]

        console.log("[v0] Timeline entries extracted:", timelineEntries.length)
        setMentions(timelineEntries)
      }
    } catch (error) {
      console.error("[v0] Error loading region mentions:", error)
    } finally {
      setLoadingMentions(false)
    }

    const { data: subregionsData } = await supabase
      .from("sub_regions")
      .select("*")
      .eq("region_id", region.id)
      .order("created_at")
    setSubregions(subregionsData || [])
  }

  const handleEdit = (region: Region) => {
    setEditingRegion(region)
    setSelectedRegion(null)
  }

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode)
    setSelectedForDeletion(new Set())
  }

  const handleToggleSelection = (regionId: string) => {
    const newSelection = new Set(selectedForDeletion)
    if (newSelection.has(regionId)) {
      newSelection.delete(regionId)
    } else {
      newSelection.add(regionId)
    }
    setSelectedForDeletion(newSelection)
  }

  const handleConfirmDelete = async () => {
    const supabase = createClient()

    for (const regionId of selectedForDeletion) {
      await supabase.from("regions").delete().eq("id", regionId)
    }

    setIsDeleteMode(false)
    setSelectedForDeletion(new Set())
    setShowDeleteConfirm(false)
    router.refresh()
  }

  const handleCancelDelete = () => {
    setIsDeleteMode(false)
    setSelectedForDeletion(new Set())
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar regiões..."
            className="pl-10 bg-card border-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          {!isDeleteMode ? (
            <>
              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={!isActive}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Região
              </Button>
              <Button
                onClick={handleToggleDeleteMode}
                disabled={!isActive}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/20 hover:border-primary bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Região
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCancelDelete}
                variant="outline"
                className="border-border text-foreground hover:bg-muted bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedForDeletion.size === 0}
                className="bg-enemy hover:bg-enemy/90 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar ({selectedForDeletion.size})
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRegions.map((region) => (
          <Card
            key={region.id}
            onClick={() => !isDeleteMode && handleSelectRegion(region)}
            className="bg-card border-primary/30 hover:bg-card/70 transition-all cursor-pointer group overflow-hidden relative"
          >
            {isDeleteMode && (
              <div
                className="absolute top-4 left-4 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleSelection(region.id)
                }}
              >
                <Checkbox checked={selectedForDeletion.has(region.id)} className="bg-background border-primary" />
              </div>
            )}
            <CardContent className="p-0">
              <div className="relative aspect-[21/9] overflow-hidden">
                {region.image_url ? (
                  <img
                    src={region.image_url || "/placeholder.svg"}
                    alt={region.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-card" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent flex items-end p-6">
                  <h3 className="text-primary font-serif text-3xl">{region.name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir {selectedForDeletion.size}{" "}
              {selectedForDeletion.size === 1 ? "região" : "regiões"}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-enemy hover:bg-enemy/90 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedRegion && (
        <Dialog open={!!selectedRegion} onOpenChange={() => setSelectedRegion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background border-primary/30 text-foreground">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-serif text-primary">{selectedRegion.name}</DialogTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!isActive}
                    onClick={() => handleEdit(selectedRegion)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedRegion(null)}
                    className="text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="text-primary font-serif mb-2">Historia</h4>
                <p className="text-foreground leading-relaxed text-sm">
                  {selectedRegion.history || selectedRegion.short_description || "Nenhuma história disponível."}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-primary font-serif mb-2">Pontos de Interesse</h4>
                  {subregions.length > 0 ? (
                    <div className="space-y-2">
                      {subregions.map((sub) => (
                        <div key={sub.id} className="text-foreground text-sm">
                          <p className="font-medium">{sub.name}</p>
                          {sub.description && <p className="text-muted-foreground text-xs">{sub.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nenhum ponto de interesse registrado.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-primary font-serif mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Aparições nas Anotações ({mentions.length})
                  </h4>
                  {loadingMentions ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Carregando aparições...</span>
                    </div>
                  ) : mentions.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {mentions.map((entry) => (
                        <Link
                          key={entry.id}
                          href={`/adventure/${adventure.id}/entry/${entry.task_id}`}
                          className="block"
                        >
                          <Card className="bg-card border-primary/30 hover:bg-card/90 transition-colors cursor-pointer">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-foreground line-clamp-1">{entry.title}</h5>
                                  {entry.content && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{entry.content}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                                      Anotação
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Esta região ainda não foi mencionada em nenhuma anotação.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <RegionCrudDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        adventureId={adventure.id}
        onSuccess={() => {
          setShowCreateDialog(false)
          router.refresh()
        }}
      />

      <RegionCrudDialog
        open={!!editingRegion}
        onOpenChange={(open) => !open && setEditingRegion(null)}
        adventureId={adventure.id}
        region={editingRegion}
        onSuccess={() => {
          setEditingRegion(null)
          router.refresh()
        }}
      />
    </main>
  )
}
