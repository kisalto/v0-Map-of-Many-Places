"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfileProps {
  profile: {
    id: string
    display_name: string
    email: string
    role: string
  } | null
}

export function UserProfile({ profile }: UserProfileProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (!profile) return null

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 bg-slate-700 border-2 border-amber-400/30">
            <AvatarFallback className="bg-slate-700 text-amber-400 font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-chart-5 border rounded-none bg-background" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-chart-1">{profile.display_name}</p>
            <p className="text-xs leading-none text-slate-400">{profile.email}</p>
            <p className="text-xs leading-none text-amber-400 capitalize">{profile.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem className="text-slate-200 hover:bg-slate-700 cursor-pointer">
          <User className="mr-2 h-4 w-4 text-chart-5" />
          <span className="text-chart-5">Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-slate-200 hover:bg-slate-700 cursor-pointer">
          <Settings className="mr-2 h-4 w-4 text-chart-5" />
          <span className="text-chart-5">Configurações</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem className="text-red-400 hover:bg-slate-700 cursor-pointer" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
