import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Scroll, Users, MapPin, CheckSquare } from "lucide-react"
import Link from "next/link"

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Buscar estatísticas do usuário
  const { count: adventuresCreated } = await supabase
    .from("adventures")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", data.user.id)

  const { count: adventuresParticipating } = await supabase
    .from("adventure_members")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", data.user.id)

  const { count: timelineEntriesCreated } = await supabase
    .from("timeline_entries")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", data.user.id)

  const { count: npcsCreated } = await supabase
    .from("npcs")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", data.user.id)

  const initial = profile?.display_name?.[0]?.toUpperCase() || "U"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/30 bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-foreground hover:text-primary">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-2xl font-serif font-bold text-foreground">Perfil do Usuário</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Card */}
          <Card className="border-primary/30 bg-card">
            <CardHeader>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 bg-card border-4 border-primary/30">
                  <AvatarFallback className="bg-card text-primary font-bold text-4xl">{initial}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-3xl font-serif font-bold text-foreground mb-1">{profile?.display_name}</h2>
                  <p className="text-muted-foreground mb-2">@{profile?.username}</p>
                  <p className="text-muted-foreground text-sm">{profile?.email}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-primary/30 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Campanhas Criadas</CardTitle>
                <Scroll className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{adventuresCreated || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Campanhas onde você é o mestre</p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Campanhas Participando</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{adventuresParticipating || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total de campanhas que você participa</p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Anotações Criadas</CardTitle>
                <CheckSquare className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{timelineEntriesCreated || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total de entradas na timeline</p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">NPCs Criados</CardTitle>
                <MapPin className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{npcsCreated || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Personagens não-jogáveis criados</p>
              </CardContent>
            </Card>
          </div>

          {/* Account Information */}
          <Card className="border-primary/30 bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome de Usuário</p>
                  <p className="text-foreground font-medium">{profile?.display_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome de Login</p>
                  <p className="text-foreground font-medium">@{profile?.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground font-medium">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Membro desde</p>
                  <p className="text-foreground font-medium">
                    {new Date(profile?.created_at || "").toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
