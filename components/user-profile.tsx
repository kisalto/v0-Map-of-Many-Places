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
import { User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfileProps {
  profile: {
    id: string
    username: string
    display_name: string
    email: string
  } | null
}

export function UserProfile({ profile }: UserProfileProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  if (!profile) return null

  const initial = profile.display_name?.[0]?.toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10 bg-[#302831] border-2 border-[#EE9B3A]/30">
            <AvatarFallback className="bg-[#302831] text-[#EE9B3A] font-semibold text-lg">{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-[#EE9B3A]/30 rounded-lg bg-[#0B0A13] border" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-[#E7D1B1]">{profile.display_name}</p>
            <p className="text-xs leading-none text-[#9F8475]">@{profile.username}</p>
            <p className="text-xs leading-none text-[#9F8475]">{profile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#302831]" />
        <DropdownMenuItem
          className="text-[#E7D1B1] hover:bg-[#302831] cursor-pointer focus:bg-[#302831] focus:text-[#E7D1B1]"
          onClick={() => router.push("/profile")}
        >
          <User className="mr-2 h-4 w-4 text-[#EE9B3A]" />
          <span>Ver Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#302831]" />
        <DropdownMenuItem
          className="text-red-400 hover:bg-[#302831] cursor-pointer focus:bg-[#302831] focus:text-red-400"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
