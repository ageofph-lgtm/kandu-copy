import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight, Smartphone, Zap, Shield, Users, Check } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function Welcome() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

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
    { icon: "👷", title: "Conecte-se", description: "Encontre profissionais ou obras" },
    { icon: "⚡", title: "Rápido", description: "Candidaturas em segundos" },
    { icon: "🛡️", title: "Seguro", description: "Avaliações verificadas" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo Hexagonal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="relative w-32 h-36 mx-auto mb-6">
            {/* Glow effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#F26522] to-orange-600 opacity-20"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', transform: 'scale(1.1)' }}
            />
            {/* Border */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#F26522] to-orange-600"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            />
            {/* Inner */}
            <div 
              className="absolute inset-[3px] bg-white flex items-center justify-center"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            >
              <span className="text-5xl font-bold text-[#F26522]">Eos</span>
            </div>
            {/* Verified badge */}
            <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm z-20">
              <Check className="w-3 h-3" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Eos</h1>
          <p className="text-[#F26522] font-semibold text-sm uppercase tracking-wider flex items-center justify-center gap-1">
            <Check className="w-4 h-4" /> Conectando obras a profissionais
          </p>
        </motion.div>

        {/* Features em hexágonos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center gap-3 mb-10 w-full max-w-md"
        >
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div 
                className="w-20 h-22 bg-gray-100 flex flex-col items-center justify-center mx-auto mb-2 p-3"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <span className="text-2xl mb-1">{feature.icon}</span>
              </div>
              <p className="text-[#1E293B] text-xs font-semibold">{feature.title}</p>
              <p className="text-[#64748B] text-[10px]">{feature.description}</p>
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
            className="w-full h-14 bg-[#F26522] hover:bg-orange-600 text-white text-lg font-semibold rounded-xl shadow-lg shadow-[#F26522]/30 flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            {isInstallable ? "Instalar Aplicativo" : "Instalar App"}
          </Button>

          {/* Botão de continuar sem instalar */}
          <Button
            onClick={handleContinueWithoutInstall}
            variant="outline"
            className="w-full h-12 text-[#1E293B] border-gray-200 hover:bg-gray-50 text-base rounded-xl flex items-center justify-center gap-2"
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
            <div className="flex items-center gap-2 text-[#64748B] text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Use o menu do navegador para instalar</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-[#64748B] text-sm">
          © 2026 Eos. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}