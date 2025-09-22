"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MapPin, Compass } from "lucide-react"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("") // Mudou de email para identifier (email ou username)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const isEmail = identifier.includes("@")

      if (isEmail) {
        // Login com email
        const { error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        })
        if (error) throw error
      } else {
        // Login com username - busca o email primeiro
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", identifier)
          .single()

        if (profileError || !profile) {
          throw new Error("Nome de usuário não encontrado")
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password,
        })
        if (error) throw error
      }

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
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
          <p className="text-amber-700">Entre em sua jornada de exploração</p>
        </div>

        <Card className="border-amber-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-900 font-serif">Entrar</CardTitle>
            <CardDescription className="text-amber-700">Acesse seu mapa de aventuras</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="identifier" className="text-amber-800">
                    Email ou Nome de Usuário
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="explorador@aventura.com ou meuusername"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="border-amber-300 focus:border-amber-500 bg-white/70"
                  />
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
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm">
                <span className="text-amber-700">Não tem uma conta? </span>
                <Link
                  href="/auth/signup"
                  className="text-amber-600 hover:text-amber-800 underline underline-offset-4 font-medium"
                >
                  Criar conta
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
