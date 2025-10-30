import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdventureHeader } from "@/components/adventure-header"
import { RegionsView } from "@/components/regions-view"

export default async function RegionsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: regions } = await supabase
    .from("regions")
    .select("*, points_of_interest(*)")
    .eq("adventure_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[#0B0A13]">
      <AdventureHeader adventure={adventure} profile={profile} />
      <RegionsView adventure={adventure} regions={regions || []} />
    </div>
  )
}
