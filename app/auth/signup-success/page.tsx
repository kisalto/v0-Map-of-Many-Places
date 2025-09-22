import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <CheckCircle className="h-12 w-12 text-emerald-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Conta Criada com Sucesso!</CardTitle>
            <CardDescription className="text-slate-300">Verifique seu email para confirmar</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-sm text-slate-300 mb-6">
              Enviamos um email de confirmação para você. Clique no link do email para ativar sua conta e começar suas
              aventuras.
            </p>
            <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 underline underline-offset-4">
              Voltar para o login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
