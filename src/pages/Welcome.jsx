import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight, Smartphone, Zap, Shield, Users } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function Welcome() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      navigate(createPageUrl("Dashboard"));
      return;
    }

    // Captura o evento de instalação
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detecta quando o app foi instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [navigate]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback para navegadores que não suportam
      alert("Para instalar, use o menu do navegador e selecione 'Adicionar à tela inicial' ou 'Instalar aplicativo'.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const handleContinueWithoutInstall = () => {
    navigate(createPageUrl("Dashboard"));
  };

  const features = [
    { icon: Users, title: "Conecte-se", description: "Encontre profissionais ou obras" },
    { icon: Zap, title: "Rápido", description: "Candidaturas e propostas em segundos" },
    { icon: Shield, title: "Seguro", description: "Avaliações e verificações" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col">
      {/* Header com logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-blue-600">K</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">KANDU</h1>
          <p className="text-blue-100 text-lg">Conectando obras a profissionais</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-3 gap-4 mb-10 w-full max-w-md"
        >
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-white text-sm font-medium">{feature.title}</p>
              <p className="text-blue-200 text-xs">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Botões de ação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="w-full max-w-sm space-y-4"
        >
          {/* Botão de Instalação */}
          <Button
            onClick={handleInstallClick}
            className="w-full h-14 bg-white text-blue-600 hover:bg-blue-50 text-lg font-semibold rounded-xl shadow-lg flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            {isInstallable ? "Instalar Aplicativo" : "Instalar App"}
          </Button>

          {/* Botão de continuar sem instalar */}
          <Button
            onClick={handleContinueWithoutInstall}
            variant="ghost"
            className="w-full h-12 text-white hover:bg-white/10 text-base rounded-xl flex items-center justify-center gap-2"
          >
            Continuar sem instalar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Dica de instalação */}
        {!isInstallable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center"
          >
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Use o menu do navegador para instalar</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-blue-200 text-sm">
          © 2026 KANDU. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}