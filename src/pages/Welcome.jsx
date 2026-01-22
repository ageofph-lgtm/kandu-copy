import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight, Smartphone, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function Welcome() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalling(false);
      // Redireciona imediatamente após instalação
      setTimeout(() => navigate(createPageUrl("Dashboard")), 500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [navigate]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Instruções específicas por navegador
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        alert("No Safari, toque no botão de partilha (⬆️) e selecione 'Adicionar ao Ecrã Principal'.");
      } else if (isAndroid) {
        alert("No menu do navegador (⋮), selecione 'Instalar aplicação' ou 'Adicionar ao ecrã inicial'.");
      } else {
        alert("No menu do navegador, selecione 'Instalar aplicação' ou 'Adicionar à tela inicial'.");
      }
      return;
    }

    setIsInstalling(true);
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } catch (error) {
      console.error("Erro na instalação:", error);
    } finally {
      setIsInstalling(false);
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
        {/* Logo KANDU */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c6abd952b45c1542486306/b7d29bb54_1768817269680.png"
            alt="KANDU Logo"
            className="h-24 mx-auto mb-4 object-contain"
          />
          <p className="text-[#64748B] text-sm">
            Conectando obras a profissionais
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