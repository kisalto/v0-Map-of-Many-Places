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
    console.log("[v0] ========== LOGIN ATTEMPT START ==========")

    if (!identifier || !identifier.trim()) {
      console.error("[v0] Validation failed: identifier is empty")
      setError("Por favor, insira seu email ou nome de login")
      return
    }

    if (!password || password.length < 6) {
      console.error("[v0] Validation failed: password too short")
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const isEmail = identifier.includes("@")
      console.log("[v0] Login attempt with:", {
        identifier: identifier.substring(0, 3) + "***",
        isEmail,
        identifierLength: identifier.length,
        passwordLength: password.length,
      })

      if (isEmail) {
        console.log("[v0] Attempting email login...")

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(identifier)) {
          console.error("[v0] Invalid email format:", identifier)
          throw new Error("Formato de email inválido")
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        })

        console.log("[v0] Email login response:", {
          success: !error,
          hasUser: !!data?.user,
          userId: data?.user?.id,
          error: error?.message,
        })

        if (error) {
          console.error("[v0] Email login error:", error)
          throw error
        }

        if (!data?.user) {
          console.error("[v0] No user data returned after login")
          throw new Error("Erro ao autenticar usuário")
        }

        console.log("[v0] Email login successful for user:", data.user.id)
      } else {
        console.log("[v0] Attempting username login...")
        console.log("[v0] Looking up email by username:", identifier.substring(0, 3) + "***")

        if (identifier.length < 3) {
          console.error("[v0] Username too short:", identifier.length)
          throw new Error("Nome de login deve ter pelo menos 3 caracteres")
        }

        const { data: emailData, error: emailError } = await supabase.rpc("get_email_by_username", {
          username_input: identifier,
        })

        console.log("[v0] RPC get_email_by_username result:", {
          success: !emailError,
          hasEmail: !!emailData,
          email: emailData ? emailData.substring(0, 3) + "***" : null,
          error: emailError?.message,
        })

        if (emailError) {
          console.error("[v0] RPC error:", emailError)
          throw new Error("Erro ao buscar usuário: " + emailError.message)
        }

        if (!emailData) {
          console.error("[v0] Username not found:", identifier)
          throw new Error("Nome de usuário não encontrado")
        }

        console.log("[v0] Found email for username, attempting login...")
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailData,
          password,
        })

        console.log("[v0] Username login response:", {
          success: !error,
          hasUser: !!data?.user,
          userId: data?.user?.id,
          error: error?.message,
        })

        if (error) {
          console.error("[v0] Password login error:", error)
          throw error
        }

        if (!data?.user) {
          console.error("[v0] No user data returned after username login")
          throw new Error("Erro ao autenticar usuário")
        }

        console.log("[v0] Username login successful for user:", data.user.id)
      }

      console.log("[v0] Login successful, redirecting to dashboard")
      router.push("/dashboard")
      router.refresh()
      console.log("[v0] ========== LOGIN ATTEMPT END (SUCCESS) ==========")
    } catch (error: unknown) {
      console.error("[v0] ========== LOGIN ATTEMPT END (ERROR) ==========")
      console.error("[v0] Login error details:", error)
      setError(error instanceof Error ? error.message : "Erro ao fazer login")
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
