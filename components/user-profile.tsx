"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    console.log("[v0] Signing out user")
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  if (!profile) return null

  const initial = profile.display_name?.[0]?.toUpperCase() || "U"

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="relative h-10 w-10 rounded-full p-0 hover:opacity-80 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-10 w-10 bg-[#302831] border-2 border-[#EE9B3A]/30">
          <AvatarFallback className="bg-[#302831] text-[#EE9B3A] font-semibold text-lg">{initial}</AvatarFallback>
        </Avatar>
      </Button>

      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu dropdown */}
          <div className="absolute right-0 top-12 w-56 bg-[#0B0A13] border border-[#EE9B3A]/30 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#302831]">
              <p className="text-sm font-medium text-[#E7D1B1]">{profile.display_name}</p>
              <p className="text-xs text-[#9F8475]">@{profile.username}</p>
              <p className="text-xs text-[#9F8475]">{profile.email}</p>
            </div>

            <button
              className="w-full px-3 py-2 text-left text-sm text-[#E7D1B1] hover:bg-[#302831] flex items-center gap-2 transition-colors"
              onClick={() => {
                setIsOpen(false)
                router.push("/profile")
              }}
            >
              <User className="h-4 w-4 text-[#EE9B3A]" />
              <span>Ver Perfil</span>
            </button>

            <div className="border-t border-[#302831]" />

            <button
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[#302831] flex items-center gap-2 transition-colors"
              onClick={() => {
                setIsOpen(false)
                handleSignOut()
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
