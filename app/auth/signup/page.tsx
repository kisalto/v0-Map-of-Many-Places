"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loginName, setLoginName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] ========== SIGNUP ATTEMPT START ==========")

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Validating input fields...")

    if (!email || !email.trim()) {
      console.error("[v0] Validation failed: email is empty")
      setError("Por favor, insira seu email")
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error("[v0] Validation failed: invalid email format")
      setError("Formato de email inválido")
      setIsLoading(false)
      return
    }

    if (!username || username.trim().length < 2) {
      console.error("[v0] Validation failed: username too short")
      setError("O nome de usuário deve ter pelo menos 2 caracteres")
      setIsLoading(false)
      return
    }

    if (!loginName || loginName.trim().length < 3) {
      console.error("[v0] Validation failed: loginName too short")
      setError("O nome de login deve ter pelo menos 3 caracteres")
      setIsLoading(false)
      return
    }

    const loginNameRegex = /^[a-z0-9_]+$/
    if (!loginNameRegex.test(loginName)) {
      console.error("[v0] Validation failed: invalid loginName format")
      setError("Nome de login deve conter apenas letras minúsculas, números e underscore")
      setIsLoading(false)
      return
    }

    if (!password || password.length < 6) {
      console.error("[v0] Validation failed: password too short")
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      console.error("[v0] Validation failed: passwords don't match")
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    console.log("[v0] All validations passed")
    console.log("[v0] Signup data:", {
      email: email.substring(0, 3) + "***",
      username: username.substring(0, 3) + "***",
      loginName: loginName.substring(0, 3) + "***",
      passwordLength: password.length,
    })

    try {
      console.log("[v0] Checking if username already exists...")

      const { data: existingUser, error: checkError } = await supabase.rpc("get_email_by_username", {
        username_input: loginName,
      })

      console.log("[v0] Username check result:", {
        exists: !!existingUser,
        error: checkError?.message,
      })

      if (existingUser) {
        console.error("[v0] Username already exists:", loginName)
        throw new Error("Nome de login já está em uso")
      }

      console.log("[v0] Creating new user account...")
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            display_name: username,
            username: loginName,
          },
        },
      })

      console.log("[v0] Signup response:", {
        success: !error,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        needsConfirmation: !!data?.user && !data?.session,
        error: error?.message,
      })

      if (error) {
        console.error("[v0] Signup error:", error)
        if (error.message.includes("unique") || error.message.includes("duplicate")) {
          throw new Error("Email ou nome de login já está em uso")
        }
        throw error
      }

      if (!data?.user) {
        console.error("[v0] No user data returned after signup")
        throw new Error("Erro ao criar conta")
      }

      console.log("[v0] Signup successful for user:", data.user.id)

      console.log("[v0] Creating profile manually...")
      try {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: email,
          username: loginName,
          display_name: username,
        })

        if (profileError) {
          console.error("[v0] Profile creation error:", profileError)
          // Se o profile já existe (trigger funcionou), não é um erro crítico
          if (!profileError.message.includes("duplicate") && !profileError.message.includes("unique")) {
            throw new Error("Erro ao criar perfil de usuário")
          } else {
            console.log("[v0] Profile already exists (trigger worked), continuing...")
          }
        } else {
          console.log("[v0] Profile created successfully")
        }
      } catch (profileError) {
        console.error("[v0] Failed to create profile:", profileError)
        // Não bloquear o signup se o profile não for criado
        // O usuário pode tentar fazer login e o sistema tentará criar o profile novamente
      }

      console.log("[v0] Redirecting to signup success page...")
      router.push("/auth/signup-success")
      console.log("[v0] ========== SIGNUP ATTEMPT END (SUCCESS) ==========")
    } catch (error: unknown) {
      console.error("[v0] ========== SIGNUP ATTEMPT END (ERROR) ==========")
      console.error("[v0] Signup error details:", error)
      setError(error instanceof Error ? error.message : "Ocorreu um erro")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0A13] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-[#EE9B3A] mb-2">Map of Many Places</h1>
          <p className="text-[#9F8475]">Comece sua jornada</p>
        </div>

        <div className="bg-[#302831] border border-[#EE9B3A]/30 rounded-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl text-[#EE9B3A] font-serif mb-2">Criar Conta</h2>
            <p className="text-[#9F8475] text-sm">Junte-se à comunidade</p>
          </div>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-[#E7D1B1]">
                  Nome de Usuário
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Seu nome"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#0B0A13] border-[#EE9B3A]/30 text-[#E7D1B1] placeholder:text-[#9F8475] focus:border-[#EE9B3A]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loginName" className="text-[#E7D1B1]">
                  Nome de Login
                </Label>
                <Input
                  id="loginName"
                  type="text"
                  placeholder="meulogin"
                  required
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="bg-[#0B0A13] border-[#EE9B3A]/30 text-[#E7D1B1] placeholder:text-[#9F8475] focus:border-[#EE9B3A]"
                />
                <p className="text-xs text-[#9F8475]">Apenas letras minúsculas, números e underscore</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[#E7D1B1]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  className="bg-[#0B0A13] border-[#EE9B3A]/30 text-[#E7D1B1] focus:border-[#EE9B3A]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-[#E7D1B1]">
                  Confirmar Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#0B0A13] border-[#EE9B3A]/30 text-[#E7D1B1] focus:border-[#EE9B3A]"
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
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </div>
            <div className="mt-6 text-center text-sm">
              <span className="text-[#9F8475]">Já tem uma conta? </span>
              <Link href="/auth/login" className="text-[#EE9B3A] hover:text-[#EE9B3A]/80 underline underline-offset-4">
                Entrar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
