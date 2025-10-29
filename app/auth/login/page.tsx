"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!identifier || !identifier.trim()) {
      setError("Por favor, insira seu email ou nome de login")
      return
    }

    if (!password || password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const isEmail = identifier.includes("@")
      let emailToUse = identifier

      if (!isEmail) {
        if (identifier.length < 3) {
          throw new Error("Nome de login deve ter pelo menos 3 caracteres")
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", identifier)
          .maybeSingle()

        if (profileError) {
          throw new Error("Erro ao buscar usuário. Tente usar seu email para fazer login.")
        }

        if (!profileData || !profileData.email) {
          throw new Error(
            "Nome de usuário não encontrado. Por favor, use seu EMAIL para fazer login pela primeira vez.",
          )
        }

        emailToUse = profileData.email
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(identifier)) {
          throw new Error("Formato de email inválido")
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email ou senha incorretos. Verifique suas credenciais e tente novamente.")
        }
        throw error
      }

      if (!data?.user) {
        throw new Error("Erro ao autenticar usuário. Tente novamente.")
      }

      // Buscar profile pelo email (não pelo ID) para lidar com múltiplos usuários
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", data.user.email!)
        .maybeSingle()

      if (existingProfile && existingProfile.id !== data.user.id) {
        // Profile existe mas com ID diferente - atualizar o ID
        await supabase.from("profiles").update({ id: data.user.id }).eq("email", data.user.email!)
      } else if (!existingProfile) {
        // Profile não existe - criar novo
        const username = data.user.user_metadata?.username || data.user.email?.split("@")[0] || "user"
        const displayName = data.user.user_metadata?.display_name || username

        await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email!,
          username: username,
          display_name: displayName,
        })
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0A13] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-[#EE9B3A] mb-2">Map of Many Places</h1>
          <p className="text-[#9F8475]">Entre em sua jornada de exploração</p>
        </div>

        <div className="bg-[#302831] border border-[#EE9B3A]/30 rounded-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl text-[#EE9B3A] font-serif mb-2">Entrar</h2>
            <p className="text-[#9F8475] text-sm">Acesse seu mapa de aventuras</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="identifier" className="text-[#E7D1B1]">
                  Email ou Nome de Login
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="explorador@aventura.com ou meulogin"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="bg-[#0B0A13] border-[#EE9B3A]/30 text-[#E7D1B1] placeholder:text-[#9F8475] focus:border-[#EE9B3A]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-[#E7D1B1]">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0B0A13] border-[#EE9B3A]/30 text-[#E7D1B1] placeholder:text-[#9F8475] focus:border-[#EE9B3A]"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-md">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13] font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
            <div className="mt-6 text-center text-sm">
              <span className="text-[#9F8475]">Não tem uma conta? </span>
              <Link href="/auth/signup" className="text-[#EE9B3A] hover:text-[#EE9B3A]/80 underline underline-offset-4">
                Criar conta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
