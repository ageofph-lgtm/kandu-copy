import React, { useState, useEffect } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, MapPin, Info } from "lucide-react";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORIES = [
  { name: "Pintura", icon: "🎨" },
  { name: "Eletricidade", icon: "⚡" },
  { name: "Canalização", icon: "🔧" },
  { name: "Alvenaria", icon: "🧱" },
  { name: "Ladrilhador", icon: "🔲" },
  { name: "Carpintaria", icon: "🪚" },
  { name: "Climatização", icon: "❄️" },
  { name: "Isolamentos", icon: "🏗️" },
  { name: "Pavimentos", icon: "🏠" },
  { name: "Telhados", icon: "🏘️" },
];

const LOCATION_COORDS = {
  "Lisboa - Centro": { lat: 38.713, lon: -9.139 },
  "Lisboa - Arroios": { lat: 38.73, lon: -9.135 },
  "Lisboa - Estrela": { lat: 38.712, lon: -9.16 },
  "Lisboa - Baixa": { lat: 38.71, lon: -9.138 },
  "Lisboa - Chiado": { lat: 38.711, lon: -9.143 },
  "Lisboa - Bairro Alto": { lat: 38.712, lon: -9.145 },
  "Lisboa - Príncipe Real": { lat: 38.716, lon: -9.15 },
  "Lisboa - Campo de Ourique": { lat: 38.715, lon: -9.165 },
  "Lisboa - Avenidas Novas": { lat: 38.736, lon: -9.153 },
  "Porto - Centro": { lat: 41.15, lon: -8.61 },
  "Braga": { lat: 41.55, lon: -8.42 },
  "Coimbra": { lat: 40.21, lon: -8.42 },
  "Aveiro": { lat: 40.64, lon: -8.65 }
};

const PRICE_SUGGESTIONS = {
  "Pintura":     { min: 300,  max: 2000, avg: 800  },
  "Eletricidade":{ min: 150,  max: 1500, avg: 500  },
  "Canalização": { min: 200,  max: 2000, avg: 600  },
  "Alvenaria":   { min: 500,  max: 5000, avg: 1500 },
  "Ladrilhador": { min: 300,  max: 3000, avg: 800  },
  "Carpintaria": { min: 200,  max: 2500, avg: 700  },
  "Climatização":{ min: 400,  max: 3000, avg: 1000 },
  "Isolamentos": { min: 500,  max: 4000, avg: 1200 },
  "Pavimentos":  { min: 800,  max: 6000, avg: 2000 },
  "Telhados":    { min: 1000, max: 8000, avg: 3000 },
};

const STEP_LABELS = ["O Quê", "Onde & Quando", "Orçamento", "Revisão"];

export default function NewJob() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [formData, setFormData] = useState({
    title: "", category: "", description: "",
    location: "", start_date: "", end_date: "",
    price_type: "fixed", price: "", urgency: "medium"
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        if (userData.user_type !== 'employer' && userData.user_type !== 'admin') {
          navigate(createPageUrl("Home"));
          return;
        }
        setUser(userData);
      } catch {
        navigate(createPageUrl("Home"));
      }
    };
    loadUser();
  }, [navigate]);

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const canGoNext = () => {
    if (step === 1) return formData.title.trim() && formData.category && formData.description.trim();
    if (step === 2) return !!formData.location;
    if (step === 3) return !!formData.price;
    return true;
  };

  const handlePublish = () => {
    // Trigger phone verification before each submission
    setShowPhoneVerification(true);
  };

  const handleSubmit = async () => {
    setShowPhoneVerification(false);
    setIsSubmitting(true);
    try {
      const coords = LOCATION_COORDS[formData.location];
      await Job.create({
        ...formData,
        price: parseFloat(formData.price),
        employer_id: user.id,
        latitude: coords.lat + (Math.random() - 0.5) * 0.005,
        longitude: coords.lon + (Math.random() - 0.5) * 0.005,
        views: 0,
        status: "open"
      });
      navigate(createPageUrl("MyJobs"));
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao publicar obra.");
    }
    setIsSubmitting(false);
  };

  const priceSuggestion = formData.category ? PRICE_SUGGESTIONS[formData.category] : null;
  const catIcon = CATEGORIES.find(c => c.name === formData.category)?.icon || "";

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-4xl font-bold text-[#F26522] animate-pulse">φ</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-400">Passo {step} de {STEP_LABELS.length}</p>
          <h1 className="font-bold text-gray-900">{STEP_LABELS[step - 1]}</h1>
        </div>
        <span className="text-sm text-gray-400">{step}/{STEP_LABELS.length}</span>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-4 pb-3">
        <div className="flex gap-1">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < step ? 'bg-[#F26522]' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 pb-28">
        <div className="max-w-lg mx-auto">

          {/* STEP 1: O Quê */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Título da obra *</label>
                <Input
                  placeholder="Ex: Pintar apartamento T2"
                  value={formData.title}
                  onChange={e => set("title", e.target.value)}
                  className="h-12 rounded-xl border-gray-200 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Categoria *</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => set("category", cat.name)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                        formData.category === cat.name
                          ? 'border-[#F26522] bg-orange-50 scale-105 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-1">{cat.icon}</span>
                      <span className="text-[9px] text-center text-gray-600 font-medium leading-tight">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição *</label>
                <Textarea
                  placeholder="Descreva em detalhe o trabalho a realizar..."
                  value={formData.description}
                  onChange={e => set("description", e.target.value)}
                  rows={4}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Onde & Quando */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Localização *</label>
                <Select value={formData.location} onValueChange={v => set("location", v)}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-200">
                    <SelectValue placeholder="Selecione a localização" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(LOCATION_COORDS).map(loc => (
                      <SelectItem key={loc} value={loc}>
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{loc}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Urgência</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'low',    label: 'Baixa',  emoji: '🟢', active: 'border-blue-400   bg-blue-50   text-blue-700'   },
                    { value: 'medium', label: 'Média',  emoji: '🟡', active: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
                    { value: 'high',   label: 'Alta',   emoji: '🔴', active: 'border-red-400    bg-red-50    text-red-700'    },
                  ].map(u => (
                    <button
                      key={u.value}
                      onClick={() => set("urgency", u.value)}
                      className={`py-4 rounded-2xl border-2 font-medium text-sm transition-all ${
                        formData.urgency === u.value ? u.active : 'border-gray-200 text-gray-500 bg-white'
                      }`}
                    >
                      <div className="text-xl mb-1">{u.emoji}</div>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Data de início</label>
                  <Input type="date" value={formData.start_date} onChange={e => set("start_date", e.target.value)} className="h-12 rounded-xl border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Data de fim</label>
                  <Input type="date" value={formData.end_date} onChange={e => set("end_date", e.target.value)} className="h-12 rounded-xl border-gray-200" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Orçamento */}
          {step === 3 && (
            <div className="space-y-5">
              {priceSuggestion && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-orange-800 mb-1">
                    💡 Preço médio para {catIcon} {formData.category}
                  </p>
                  <p className="text-xs text-orange-600 mb-2">
                    Mercado: €{priceSuggestion.min} – €{priceSuggestion.max}
                  </p>
                  <button
                    onClick={() => set("price", String(priceSuggestion.avg))}
                    className="text-xs text-orange-700 font-semibold underline"
                  >
                    Usar valor médio (€{priceSuggestion.avg})
                  </button>
                </div>
              )}
              {/* Price disclaimer */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Nota:</strong> The price basis will consider only the main job, hence, it does not take in consideration the quotes (goods, tools etc).
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de preço</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'fixed',      label: 'Projeto',    emoji: '💰' },
                    { value: 'negotiable', label: 'Negociável', emoji: '🤝' },
                    { value: 'hourly',     label: 'À hora',     emoji: '⏱️' },
                  ].map(pt => (
                    <button
                      key={pt.value}
                      onClick={() => set("price_type", pt.value)}
                      className={`py-4 rounded-2xl border-2 font-medium text-sm transition-all ${
                        formData.price_type === pt.value
                          ? 'border-[#F26522] bg-orange-50 text-[#F26522]'
                          : 'border-gray-200 text-gray-500 bg-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{pt.emoji}</div>
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valor (€){formData.price_type === 'hourly' ? ' / hora' : ''} *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">€</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={formData.price}
                    onChange={e => set("price", e.target.value)}
                    className="h-16 pl-10 text-3xl font-bold rounded-xl border-gray-200 text-[#F26522]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Revisão */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Revise os detalhes</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-3">
                    <p className="font-bold text-gray-900 text-lg">{formData.title}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full">
                        {catIcon} {formData.category}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        formData.urgency === 'high'   ? 'bg-red-100 text-red-700' :
                        formData.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {formData.urgency === 'high' ? '🔴 Alta urgência' : formData.urgency === 'medium' ? '🟡 Média urgência' : '🟢 Baixa urgência'}
                      </span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#F26522] shrink-0">
                    €{formData.price}{formData.price_type === 'hourly' ? '/h' : ''}
                  </p>
                </div>
                <hr className="border-gray-100" />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4 text-gray-400" /> {formData.location}
                </div>
                {formData.start_date && (
                  <p className="text-sm text-gray-500">📅 {formData.start_date}{formData.end_date ? ` → ${formData.end_date}` : ''}</p>
                )}
                <hr className="border-gray-100" />
                <p className="text-sm text-gray-600">{formData.description}</p>
              </div>
              <p className="text-xs text-center text-gray-400">
                A obra ficará visível para profissionais na sua área imediatamente.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <Button
          onClick={() => step < 4 ? setStep(step + 1) : handlePublish()}
          disabled={!canGoNext() || isSubmitting}
          className="w-full h-14 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl text-base shadow-lg shadow-[#F26522]/20"
        >
          {step < 4 ? (
            <span className="flex items-center">Próximo <ArrowRight className="w-5 h-5 ml-2" /></span>
          ) : isSubmitting ? (
            <span className="animate-pulse">φ &nbsp;A publicar...</span>
          ) : (
            <span className="flex items-center"><Check className="w-5 h-5 mr-2" /> Publicar Obra</span>
          )}
        </Button>
      </div>
      {showPhoneVerification && (
        <PhoneVerificationModal
          phone={user?.phone}
          onVerified={handleSubmit}
          onCancel={() => setShowPhoneVerification(false)}
        />
      )}
    </div>
  );
}