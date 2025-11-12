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
    <div className="min-h-screen bg-[#0B0A13]">
      {/* Header */}
      <header className="border-b border-[#EE9B3A]/30 bg-[#0B0A13]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-bold text-[#E7D1B1]">The Cage of Worlds</h1>
            <UserProfile profile={profile} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#E7D1B1] mb-2">
              Bem-vindo, {profile?.display_name || "Usuário"}!
            </h2>
            <p className="text-[#9F8475]">Suas Campanhas</p>
          </div>
          <CreateAdventureDialog>
            <Button className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13] font-semibold">Nova Campanha</Button>
          </CreateAdventureDialog>
        </div>

        {/* Adventures Grid */}
        <div className="border border-[#EE9B3A]/30 rounded-lg p-6">
          <AdventureGrid adventures={adventures || []} />
        </div>
      </main>
    </div>
  )
}
