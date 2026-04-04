import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle } from "lucide-react";

export default function GdprConsent({ open, onAccept }) {
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm rounded-2xl" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5 text-blue-600" />
            Privacidade & RGPD
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-gray-600">
          <p>
            A <strong>KANDU</strong> recolhe e trata os seus dados pessoais (nome, email, localização e documentos de identidade) para:
          </p>
          <ul className="space-y-1 pl-2">
            {[
              "Criar e gerir o seu perfil profissional",
              "Facilitar a ligação entre empregadores e profissionais",
              "Verificar a sua identidade (KYC opcional)",
              "Enviar notificações relevantes sobre obras"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400">
            Os seus dados são tratados em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD — Regulamento (UE) 2016/679). Pode exercer os seus direitos (acesso, retificação, eliminação) em qualquer momento através do seu perfil ou contactando-nos.
          </p>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-[#F26522] transition-colors">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-[#F26522]"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
            />
            <span className="text-xs text-gray-600">
              Li e aceito a{" "}
              <span className="text-[#F26522] font-medium">Política de Privacidade</span>{" "}
              e os{" "}
              <span className="text-[#F26522] font-medium">Termos de Utilização</span>{" "}
              da plataforma KANDU, incluindo o tratamento dos meus dados pessoais.
            </span>
          </label>
        </div>

        <Button
          disabled={!checked}
          onClick={onAccept}
          className="w-full h-12 bg-[#F26522] hover:bg-orange-600 rounded-xl font-bold disabled:opacity-40"
        >
          Aceitar e Continuar
        </Button>
      </DialogContent>
    </Dialog>
  );
}