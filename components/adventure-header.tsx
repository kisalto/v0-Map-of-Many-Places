"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Settings, UserPlus, Power } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserProfile } from "@/components/user-profile"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Adventure {
  id: string
  title: string
  description: string | null
}

interface AdventureHeaderProps {
  adventure: Adventure
  profile: {
    id: string
    username: string
    display_name: string
    email: string
  } | null
}

export function AdventureHeader({ adventure, profile }: AdventureHeaderProps) {
  const pathname = usePathname()
  const [showSettings, setShowSettings] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const router = useRouter()

  const isTimelinePage = pathname === `/adventure/${adventure.id}`
  const isCharactersPage = pathname === `/adventure/${adventure.id}/characters`
  const isRegionsPage = pathname === `/adventure/${adventure.id}/regions`
  const isSearchPage = pathname === `/adventure/${adventure.id}/search`

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      const supabase = createClient()

      const { data: invitedProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail.trim())
        .single()

      if (!invitedProfile) {
        alert("Usuário não encontrado com este email")
        return
      }

      await supabase.from("adventure_members").insert({
        adventure_id: adventure.id,
        profile_id: invitedProfile.id,
        role: "player",
      })

      alert("Convite enviado com sucesso!")
      setInviteEmail("")
      setShowSettings(false)
      router.refresh()
    } catch (error) {
      console.error("Erro ao convidar:", error)
      alert("Erro ao enviar convite")
    } finally {
      setIsInviting(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm("Tem certeza que deseja desativar esta campanha?")) return

    setIsDeactivating(true)
    try {
      const supabase = createClient()

      await supabase.from("adventures").update({ is_active: false }).eq("id", adventure.id)

      alert("Campanha desativada com sucesso!")
      setShowSettings(false)
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Erro ao desativar:", error)
      alert("Erro ao desativar campanha")
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <>
      <header className="border-b border-[#EE9B3A]/30 bg-[#0B0A13]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" asChild className="text-[#E7D1B1] hover:text-[#EE9B3A]">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>

              <div className="h-6 w-px bg-[#302831]" />

              <h1 className="text-xl font-serif font-bold text-[#E7D1B1]">{adventure.title}</h1>

              <div className="h-6 w-px bg-[#302831]" />

              <nav className="flex items-center gap-1">
                <Link href={`/adventure/${adventure.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${
                      isTimelinePage
                        ? "text-[#EE9B3A] border-b-2 border-[#EE9B3A] rounded-none"
                        : "text-[#E7D1B1] hover:text-[#EE9B3A]"
                    }`}
                  >
                    Linha do Tempo
                  </Button>
                </Link>

                <Link href={`/adventure/${adventure.id}/characters`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${
                      isCharactersPage
                        ? "text-[#EE9B3A] border-b-2 border-[#EE9B3A] rounded-none"
                        : "text-[#E7D1B1] hover:text-[#EE9B3A]"
                    }`}
                  >
                    Personagens
                  </Button>
                </Link>

                <Link href={`/adventure/${adventure.id}/regions`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${
                      isRegionsPage
                        ? "text-[#EE9B3A] border-b-2 border-[#EE9B3A] rounded-none"
                        : "text-[#E7D1B1] hover:text-[#EE9B3A]"
                    }`}
                  >
                    Regiões
                  </Button>
                </Link>

                <Link href={`/adventure/${adventure.id}/search`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${
                      isSearchPage
                        ? "text-[#EE9B3A] border-b-2 border-[#EE9B3A] rounded-none"
                        : "text-[#E7D1B1] hover:text-[#EE9B3A]"
                    }`}
                  >
                    Busca
                  </Button>
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-[#84E557]/20 text-[#84E557] border-[#84E557]/30">
                Ativa
              </Badge>

              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                size="sm"
                className="border-[#302831] text-[#E7D1B1] hover:bg-[#302831] bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>

              <UserProfile profile={profile} />
            </div>
          </div>
        </div>
      </header>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#302831] border-[#EE9B3A]/30">
          <DialogHeader>
            <DialogTitle className="text-[#E7D1B1]">Configurações da Campanha</DialogTitle>
            <DialogDescription className="text-[#9F8475]">
              Gerencie os membros e configurações da sua campanha
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Convidar pessoa */}
            <div className="space-y-3">
              <Label htmlFor="invite-email" className="text-[#E7D1B1]">
                Convidar Pessoa
              </Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475]"
                />
                <Button
                  onClick={handleInvite}
                  disabled={isInviting || !inviteEmail.trim()}
                  className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13]"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convidar
                </Button>
              </div>
            </div>

            {/* Desativar campanha */}
            <div className="space-y-3 pt-4 border-t border-[#302831]">
              <Label className="text-[#E7D1B1]">Zona de Perigo</Label>
              <Button
                onClick={handleDeactivate}
                disabled={isDeactivating}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
              >
                <Power className="h-4 w-4 mr-2" />
                Desativar Campanha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
