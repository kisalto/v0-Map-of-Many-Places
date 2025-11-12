"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, LogOut, Sun, Moon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

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
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.remove("dark", "light")
      document.documentElement.classList.add(savedTheme)
    }
  }, [])

  const handleSignOut = async () => {
    console.log("[v0] Signing out user")
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.remove("dark", "light")
    document.documentElement.classList.add(newTheme)
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
          <div className="absolute right-0 top-12 w-56 bg-background border border-primary/30 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-muted">
              <p className="text-sm font-medium text-foreground">{profile.display_name}</p>
              <p className="text-xs text-muted-foreground">@{profile.username}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>

            <button
              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
              onClick={() => {
                setIsOpen(false)
                router.push("/profile")
              }}
            >
              <User className="h-4 w-4 text-primary" />
              <span>Ver Perfil</span>
            </button>

            <button
              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
              onClick={() => {
                toggleTheme()
              }}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 text-primary" />
                  <span>Tema Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-primary" />
                  <span>Tema Escuro</span>
                </>
              )}
            </button>

            <div className="border-t border-muted" />

            <button
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-muted flex items-center gap-2 transition-colors"
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
