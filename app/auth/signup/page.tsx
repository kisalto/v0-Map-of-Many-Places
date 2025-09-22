"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MapPin, Compass } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("") // Adicionado campo username
  const [role, setRole] = useState<"player" | "master">("player")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    if (username.length < 3) {
      setError("O nome de usuário deve ter pelo menos 3 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single()

      if (existingUser) {
        setError("Nome de usuário já está em uso")
        setIsLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            display_name: displayName,
            username: username, // Incluído username nos metadados
            role: role,
          },
        },
      })
      if (error) throw error
      router.push("/auth/signup-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <MapPin className="h-8 w-8 text-amber-700" />
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Compass className="h-8 w-8 text-orange-700" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-amber-900 mb-2">Map of Many Things</h1>
          <p className="text-amber-700">Comece sua jornada de exploração</p>
        </div>

        <Card className="border-amber-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-900 font-serif">Criar Conta</CardTitle>
            <CardDescription className="text-amber-700">Junte-se à comunidade de exploradores</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName" className="text-amber-800">
                    Nome de Exibição
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Seu nome"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="border-amber-300 focus:border-amber-500 bg-white/70"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-amber-800">
                    Nome de Usuário
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="meuusername"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="border-amber-300 focus:border-amber-500 bg-white/70"
                  />
                  <p className="text-xs text-amber-600">Apenas letras minúsculas, números e underscore</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-amber-800">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="explorador@aventura.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-amber-300 focus:border-amber-500 bg-white/70"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-amber-800">
                    Função
                  </Label>
                  <Select value={role} onValueChange={(value: "player" | "master") => setRole(value)}>
                    <SelectTrigger className="border-amber-300 focus:border-amber-500 bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-amber-200">
                      <SelectItem value="player" className="hover:bg-amber-50">
                        Explorador
                      </SelectItem>
                      <SelectItem value="master" className="hover:bg-amber-50">
                        Cartógrafo Mestre
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-amber-800">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-amber-300 focus:border-amber-500 bg-white/70"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="text-amber-800">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-amber-300 focus:border-amber-500 bg-white/70"
                  />
                </div>
                {error && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm">
                <span className="text-amber-700">Já tem uma conta? </span>
                <Link
                  href="/auth/login"
                  className="text-amber-600 hover:text-amber-800 underline underline-offset-4 font-medium"
                >
                  Entrar
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
