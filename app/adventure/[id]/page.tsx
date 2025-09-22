import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdventureHeader } from "@/components/adventure-header"
import { TimelineCanvas } from "@/components/timeline-canvas"
import { AdventureSidebar } from "@/components/adventure-sidebar"

interface AdventurePageProps {
  params: Promise<{ id: string }>
}

export default async function AdventurePage({ params }: AdventurePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get adventure details
  const { data: adventure, error: adventureError } = await supabase
    .from("adventures")
    .select("*")
    .eq("id", id)
    .eq("creator_id", data.user.id)
    .single()

  if (adventureError || !adventure) {
    redirect("/dashboard")
  }

  const { data: timelineData } = await supabase
    .from("timeline_entries")
    .select("*")
    .eq("adventure_id", id)
    .order("order_index", { ascending: true })

  // Get profiles for timeline entries creators
  let timelineEntries = timelineData || []
  if (timelineData && timelineData.length > 0) {
    const creatorIds = [...new Set(timelineData.map((entry) => entry.creator_id))]
    const { data: profilesData } = await supabase.from("profiles").select("id, display_name").in("id", creatorIds)

    // Combine timeline entries with profile data
    timelineEntries = timelineData.map((entry) => ({
      ...entry,
      profiles: profilesData?.find((profile) => profile.id === entry.creator_id) || null,
    }))
  }

  // Get NPCs
  const { data: npcs } = await supabase.from("npcs").select("*").eq("adventure_id", id).order("created_at")

  const { data: playersData } = await supabase
    .from("adventure_players")
    .select("*")
    .eq("adventure_id", id)
    .order("created_at")

  // Get profiles for players
  let players = playersData || []
  if (playersData && playersData.length > 0) {
    const playerProfileIds = [...new Set(playersData.map((player) => player.profile_id))]
    const { data: playerProfilesData } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", playerProfileIds)

    // Combine players with profile data
    players = playersData.map((player) => ({
      ...player,
      profiles: playerProfilesData?.find((profile) => profile.id === player.profile_id) || null,
    }))
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <AdventureHeader adventure={adventure} />
      <div className="flex-1 flex overflow-hidden">
        <AdventureSidebar adventure={adventure} npcs={npcs || []} players={players || []} />
        <main className="flex-1 relative">
          <TimelineCanvas adventureId={id} entries={timelineEntries || []} />
        </main>
      </div>
    </div>
  )
}
