import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Ops, algo deu errado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {params?.error ? (
              <p className="text-sm text-slate-300 mb-6">Erro: {params.error}</p>
            ) : (
              <p className="text-sm text-slate-300 mb-6">Ocorreu um erro não especificado.</p>
            )}
            <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 underline underline-offset-4">
              Tentar novamente
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
