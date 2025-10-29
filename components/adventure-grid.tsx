import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MapPin, Play, Scroll } from "lucide-react"
import Link from "next/link"

interface Adventure {
  id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
  is_active?: boolean
}

interface AdventureGridProps {
  adventures: Adventure[]
}

export function AdventureGrid({ adventures }: AdventureGridProps) {
  if (adventures.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <Scroll className="h-16 w-16 text-[#EE9B3A] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#E7D1B1] mb-2 font-serif">Nenhum mapa ainda</h3>
          <p className="text-[#9F8475] max-w-md mx-auto">
            Comece sua jornada criando seu primeiro mapa. Organize suas expedições, descobertas e momentos épicos!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {adventures.map((adventure) => {
        const isActive = adventure.is_active !== false

        return (
          <Card
            key={adventure.id}
            className="bg-[#302831] border-[#EE9B3A]/30 hover:bg-[#302831]/80 transition-all duration-300"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-[#E7D1B1] text-lg mb-2 font-serif">{adventure.title}</CardTitle>
                  <CardDescription className="text-[#9F8475] line-clamp-2">
                    {adventure.description || "Território inexplorado"}
                  </CardDescription>
                </div>
                {isActive ? (
                  <Badge className="bg-[#84E557]/20 text-[#84E557] border-[#84E557]/30 font-serif">Ativo</Badge>
                ) : (
                  <Badge className="bg-[#9F8475]/20 text-[#9F8475] border-[#9F8475]/30 font-serif">Desativado</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-[#9F8475] mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(adventure.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>0 exploradores</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild className="flex-1 bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13]">
                  <Link href={`/adventure/${adventure.id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    {isActive ? "Explorar" : "Visualizar"}
                  </Link>
                </Button>
                <Button className="border-[#EE9B3A]/30 text-[#EE9B3A] hover:bg-[#EE9B3A]/10 bg-transparent">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
