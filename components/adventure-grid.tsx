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
}

interface AdventureGridProps {
  adventures: Adventure[]
}

export function AdventureGrid({ adventures }: AdventureGridProps) {
  if (adventures.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <Scroll className="h-16 w-16 text-amber-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-amber-900 mb-2 font-serif">Nenhum mapa ainda</h3>
          <p className="text-amber-700 max-w-md mx-auto">
            Comece sua jornada criando seu primeiro mapa. Organize suas expedições, descobertas e momentos épicos!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {adventures.map((adventure) => (
        <Card
          key={adventure.id}
          className="bg-amber-50/80 border-2 border-amber-600/30 hover:bg-amber-100/80 transition-all duration-300 map-shadow ancient-border parchment-texture"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-amber-900 text-lg mb-2 font-serif">{adventure.title}</CardTitle>
                <CardDescription className="text-amber-700 line-clamp-2">
                  {adventure.description || "Território inexplorado"}
                </CardDescription>
              </div>
              <Badge className="bg-amber-600/20 text-amber-800 border-amber-600/40 font-serif">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-amber-700 mb-4">
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
              <Button
                asChild
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white map-shadow border border-amber-700/30"
              >
                <Link href={`/adventure/${adventure.id}`}>
                  <Play className="h-4 w-4 mr-2" />
                  Explorar
                </Link>
              </Button>
              <Button className="border-2 border-amber-600/40 text-amber-700 hover:bg-amber-100 bg-amber-50/50 map-shadow">
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
