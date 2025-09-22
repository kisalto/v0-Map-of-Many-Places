import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdventureGrid } from "@/components/adventure-grid"
import { CreateAdventureDialog } from "@/components/create-adventure-dialog"
import { UserProfile } from "@/components/user-profile"
import { Map, Compass, Scroll } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get user's adventures
  const { data: adventures } = await supabase
    .from("adventures")
    .select("*")
    .eq("creator_id", data.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 to-yellow-100/20 parchment-texture">
      {/* Header */}
      <header className="border-b border-amber-600/30 bg-amber-50/80 backdrop-blur-sm ancient-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-600/20 rounded-lg">
                  <Map className="h-6 w-6 text-amber-700" />
                </div>
                <div className="p-2 bg-amber-700/20 rounded-lg">
                  <Compass className="h-6 w-6 text-amber-800" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-900 font-serif">Map of Many Places</h1>
                <p className="text-sm text-amber-700">Explore suas jornadas em pergaminhos antigos</p>
              </div>
            </div>
            <UserProfile profile={profile} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-amber-900 mb-2 font-serif">
              Bem-vindo, {profile?.display_name || "Explorador"}!
            </h2>
            <p className="text-amber-700">
              {profile?.role === "master" ? "Seus mapas como Cartógrafo Mestre" : "Suas jornadas como Aventureiro"}
            </p>
          </div>
          <CreateAdventureDialog>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2 map-shadow border border-amber-700/30">
              <Scroll className="h-4 w-4" />
              Nova Entrada
            </Button>
          </CreateAdventureDialog>
        </div>

        {/* Adventures Grid */}
        <AdventureGrid adventures={adventures || []} />
      </main>
    </div>
  )
}
