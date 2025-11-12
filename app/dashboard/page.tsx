import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdventureGrid } from "@/components/adventure-grid"
import { CreateAdventureDialog } from "@/components/create-adventure-dialog"
import { Button } from "@/components/ui/button"
import { UserProfile } from "@/components/user-profile"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const { data: adventures } = await supabase
    .from("adventures")
    .select(`
      *,
      adventure_members!inner(role)
    `)
    .eq("adventure_members.profile_id", data.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary/30 bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-bold text-foreground">The Cage of Worlds</h1>
            <UserProfile profile={profile} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
              Bem-vindo, {profile?.display_name || "Usuário"}!
            </h2>
            <p className="text-muted-foreground">Suas Campanhas</p>
          </div>
          <CreateAdventureDialog>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Nova Campanha
            </Button>
          </CreateAdventureDialog>
        </div>

        <div className="border border-primary/30 rounded-lg p-6 bg-card/50">
          <AdventureGrid adventures={adventures || []} />
        </div>
      </main>
    </div>
  )
}
