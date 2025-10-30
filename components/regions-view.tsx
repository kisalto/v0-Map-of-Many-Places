"use client"

import { useState } from "react"
import { Search, Plus, Trash2, X, Edit2, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
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

export function RegionsView({ adventure, regions }: RegionsViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [mentions, setMentions] = useState<any[]>([])
  const [subregions, setSubregions] = useState<Subregion[]>([])
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const isActive = adventure.is_active !== false

  const filteredRegions = regions.filter((region) => region.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelectRegion = async (region: Region) => {
    setSelectedRegion(region)

    const supabase = createClient()

    setMentions([])

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9F8475]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar regiões..."
            className="pl-10 bg-[#302831] border-[#EE9B3A]/30 text-[#E7D1B1] placeholder:text-[#9F8475]"
          />
        </div>
        <div className="flex gap-2">
          {!isDeleteMode ? (
            <>
              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={!isActive}
                className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Região
              </Button>
              <Button
                onClick={handleToggleDeleteMode}
                disabled={!isActive}
                variant="outline"
                className="border-[#EE9B3A]/50 text-[#EE9B3A] hover:bg-[#EE9B3A]/20 hover:border-[#EE9B3A] bg-transparent"
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
                className="border-[#302831] text-[#E7D1B1] hover:bg-[#302831]/70 bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedForDeletion.size === 0}
                className="bg-red-500 hover:bg-red-600 text-white"
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
            className="bg-[#302831] border-[#EE9B3A]/30 hover:bg-[#302831]/70 transition-all cursor-pointer group overflow-hidden relative"
          >
            {isDeleteMode && (
              <div
                className="absolute top-4 left-4 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleSelection(region.id)
                }}
              >
                <Checkbox checked={selectedForDeletion.has(region.id)} className="bg-[#0B0A13] border-[#EE9B3A]" />
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
                  <div className="w-full h-full bg-gradient-to-br from-[#EE9B3A]/20 to-[#302831]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A13] via-[#0B0A13]/50 to-transparent flex items-end p-6">
                  <h3 className="text-[#EE9B3A] font-serif text-3xl">{region.name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#302831] border-[#EE9B3A]/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#E7D1B1]">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9F8475]">
              Tem certeza que deseja excluir {selectedForDeletion.size}{" "}
              {selectedForDeletion.size === 1 ? "região" : "regiões"}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#302831] text-[#E7D1B1] hover:bg-[#302831]/70">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedRegion && (
        <Dialog open={!!selectedRegion} onOpenChange={() => setSelectedRegion(null)}>
          <DialogContent className="max-w-4xl bg-[#0B0A13] border-[#EE9B3A]/30 text-[#E7D1B1]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-serif text-[#EE9B3A]">{selectedRegion.name}</DialogTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!isActive}
                    onClick={() => handleEdit(selectedRegion)}
                    className="text-[#EE9B3A] hover:bg-[#EE9B3A]/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedRegion(null)}
                    className="text-[#9F8475] hover:bg-[#9F8475]/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="text-[#EE9B3A] font-serif mb-2">Historia</h4>
                <p className="text-[#E7D1B1] leading-relaxed text-sm">
                  {selectedRegion.history || selectedRegion.short_description || "Nenhuma história disponível."}
                </p>
              </div>

              <div>
                <h4 className="text-[#EE9B3A] font-serif mb-2">Pontos de Interesse</h4>
                {subregions.length > 0 ? (
                  <div className="space-y-2">
                    {subregions.map((sub) => (
                      <div key={sub.id} className="text-[#E7D1B1] text-sm">
                        <p className="font-medium">{sub.name}</p>
                        {sub.description && <p className="text-[#9F8475] text-xs">{sub.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#9F8475] text-sm">Nenhum ponto de interesse registrado.</p>
                )}
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
