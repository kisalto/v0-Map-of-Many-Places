"use client"

import { useState } from "react"
import { Search, Plus, Trash2, X, Edit2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { RegionCrudDialog } from "@/components/region-crud-dialog"

interface PointOfInterest {
  id: string
  name: string
  description: string | null
}

interface Region {
  id: string
  name: string
  description: string | null
  history: string | null
  image_url: string | null
  parent_region_id: string | null
  points_of_interest: PointOfInterest[]
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
  const [mentions, setMentions] = useState<any[]>([])
  const router = useRouter()

  const isActive = adventure.is_active !== false

  // Filter regions based on search
  const filteredRegions = regions.filter((region) => region.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Load mentions when region is selected
  const handleSelectRegion = async (region: Region) => {
    setSelectedRegion(region)

    // Load mentions from database
    const supabase = createClient()
    const { data } = await supabase.from("region_mentions").select("*, tasks(*)").eq("region_name", region.name)

    setMentions(data || [])
  }

  return (
    <main className="container mx-auto px-6 py-8">
      {/* Header with search and actions */}
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
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={!isActive}
            className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Região
          </Button>
          <Button
            disabled={!isActive}
            variant="outline"
            className="border-[#EE9B3A]/30 text-[#EE9B3A] hover:bg-[#EE9B3A]/10 bg-transparent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover Região
          </Button>
        </div>
      </div>

      {/* Regions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRegions.map((region) => (
          <Card
            key={region.id}
            onClick={() => handleSelectRegion(region)}
            className="bg-[#302831] border-[#EE9B3A]/30 hover:bg-[#302831]/80 transition-all cursor-pointer group overflow-hidden"
          >
            <CardContent className="p-0">
              {/* Region image */}
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
                {/* Region name overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A13] via-[#0B0A13]/50 to-transparent flex items-end p-6">
                  <h3 className="text-[#EE9B3A] font-serif text-3xl">{region.name}</h3>
                </div>
              </div>

              {/* Sub-regions if any */}
              {region.parent_region_id && (
                <div className="p-4 border-t border-[#EE9B3A]/20">
                  <p className="text-[#9F8475] text-sm">Sub-região</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Region detail dialog */}
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
              {/* Historia */}
              <div>
                <h4 className="text-[#EE9B3A] font-serif mb-2">Historia</h4>
                <p className="text-[#E7D1B1] leading-relaxed text-sm">
                  {selectedRegion.history || selectedRegion.description || "Nenhuma história disponível."}
                </p>
              </div>

              {/* Pontos de Interesse */}
              <div>
                <h4 className="text-[#EE9B3A] font-serif mb-2">Pontos de Interesse</h4>
                {selectedRegion.points_of_interest && selectedRegion.points_of_interest.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRegion.points_of_interest.map((poi) => (
                      <div key={poi.id} className="text-[#E7D1B1] text-sm">
                        {poi.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#9F8475] text-sm">Nenhum ponto de interesse registrado.</p>
                )}
              </div>
            </div>

            {/* Mentions */}
            <div className="mt-6">
              <h4 className="text-[#EE9B3A] font-serif mb-2">Aparições</h4>
              {mentions.length > 0 ? (
                <div className="space-y-2">
                  {mentions.map((mention) => (
                    <div
                      key={mention.id}
                      className="text-[#EE9B3A] hover:underline cursor-pointer text-sm"
                      onClick={() => router.push(`/adventure/${adventure.id}/entry/${mention.task_id}`)}
                    >
                      {mention.tasks?.title || "Anotação sem título"}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#9F8475] text-sm">Nenhuma aparição registrada.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de criação de região */}
      <RegionCrudDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        adventureId={adventure.id}
        onSuccess={() => {
          setShowCreateDialog(false)
          router.refresh()
        }}
      />
    </main>
  )
}
