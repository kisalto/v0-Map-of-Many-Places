import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdventureHeader } from "@/components/adventure-header"
import { TrelloBoard } from "@/components/trello-board"
import { TasksSidebar } from "@/components/tasks-sidebar"

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, email")
    .eq("id", data.user.id)
    .single()

  const { data: adventure, error: adventureError } = await supabase.from("adventures").select("*").eq("id", id).single()

  if (adventureError || !adventure) {
    redirect("/dashboard")
  }

  const { data: membership } = await supabase
    .from("adventure_members")
    .select("role")
    .eq("adventure_id", id)
    .eq("profile_id", data.user.id)
    .single()

  if (!membership && adventure.creator_id !== data.user.id) {
    redirect("/dashboard")
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("adventure_id", id)
    .order("order_index", { ascending: true })

  const { data: sidebarTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("adventure_id", id)
    .is("chapter_id", null)
    .order("order_index", { ascending: true })

  const { data: chapterTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("adventure_id", id)
    .not("chapter_id", "is", null)
    .order("order_index", { ascending: true })

  return (
    <div className="h-screen bg-background flex flex-col">
      <AdventureHeader adventure={adventure} profile={profile} />
      <div className="flex-1 flex overflow-hidden">
        <TasksSidebar adventureId={id} tasks={sidebarTasks || []} />
        <main className="flex-1 overflow-auto">
          <TrelloBoard adventureId={id} chapters={chapters || []} entries={chapterTasks || []} />
        </main>
      </div>
    </div>
  )
}
