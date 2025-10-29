import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdventureHeader } from "@/components/adventure-header"

export default async function SearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const { data: adventure } = await supabase.from("adventures").select("*").eq("id", id).single()

  if (!adventure) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#0B0A13]">
      <AdventureHeader adventure={adventure} profile={profile} />
      <main className="container mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-serif font-bold text-[#E7D1B1] mb-4">Busca Global</h2>
          <p className="text-[#9F8475]">Em desenvolvimento...</p>
        </div>
      </main>
    </div>
  )
}
