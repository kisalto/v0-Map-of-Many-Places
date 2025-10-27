import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0B0A13] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-[#1a1825] border-[#EE9B3A]/30">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#84E557]/20 rounded-full">
                <CheckCircle className="h-12 w-12 text-[#84E557]" />
              </div>
            </div>
            <CardTitle className="text-2xl text-[#E7D1B1]">Conta Criada com Sucesso!</CardTitle>
            <CardDescription className="text-[#9F8475]">Verifique seu email para confirmar</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-8 w-8 text-[#EE9B3A]" />
            </div>
            <p className="text-sm text-[#9F8475] mb-6">
              Enviamos um email de confirmação para você. Clique no link do email para ativar sua conta e começar suas
              aventuras.
            </p>
            <Link href="/auth/login" className="text-[#EE9B3A] hover:text-[#EE9B3A]/80 underline underline-offset-4">
              Voltar para o login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
