
import React, { useState, useEffect, useCallback } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Euro } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORIES = [
  "Pintura", "Eletricidade", "Canalização", "Alvenaria", "Ladrilhador",
  "Carpintaria", "Climatização", "Isolamentos", "Pavimentos", "Telhados"
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

const LOCATIONS = Object.keys(LOCATION_COORDS);

export default function NewJob() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "", category: "", description: "", location: "",
    price_type: "fixed", price: "", urgency: "medium",
    start_date: "", end_date: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const userData = await User.me();
      if (userData.user_type !== 'employer' && userData.user_type !== 'admin') {
        alert("Apenas empregadores ou admins podem publicar obras");
        navigate(createPageUrl("Dashboard"));
        return;
      }
      setUser(userData);
    } catch (error) {
      console.log("User not authenticated");
      navigate(createPageUrl("Dashboard"));
    }
  }, [navigate]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.description || 
        !formData.location || !formData.price) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const coords = LOCATION_COORDS[formData.location];
      const jobData = {
        ...formData,
        price: parseFloat(formData.price),
        employer_id: user.id,
        latitude: coords.lat + (Math.random() - 0.5) * 0.005, // Small jitter
        longitude: coords.lon + (Math.random() - 0.5) * 0.005, // Small jitter
        views: 0,
        status: "open"
      };

      await Job.create(jobData);
      alert("Obra publicada com sucesso!");
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Erro ao publicar obra. Tente novamente.");
    }
    
    setIsSubmitting(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return <div className="flex items-center justify-center h-96"><p>Carregando...</p></div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Dashboard"))}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Obra</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Detalhes da Obra</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium mb-2">Título da obra *</label>
              <Input placeholder="Ex: Pintar apartamento T2" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} />
            </div>
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium mb-2">Categoria *</label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Localização */}
            <div>
              <label className="block text-sm font-medium mb-2">Localização *</label>
              <Select value={formData.location} onValueChange={(value) => handleChange("location", value)}>
                <SelectTrigger><SelectValue placeholder="Selecione a localização" /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{location}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Preço */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de preço *</label>
                <Select value={formData.price_type} onValueChange={(value) => handleChange("price_type", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Preço fixo</SelectItem>
                    <SelectItem value="hourly">Por hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valor (€) *</label>
                <Input type="number" placeholder="350" value={formData.price} onChange={(e) => handleChange("price", e.target.value)} />
              </div>
            </div>
            {/* Urgência */}
            <div>
              <label className="block text-sm font-medium mb-2">Urgência</label>
              <Select value={formData.urgency} onValueChange={(value) => handleChange("urgency", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data de início</label>
                <Input type="date" value={formData.start_date} onChange={(e) => handleChange("start_date", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data de fim</label>
                <Input type="date" value={formData.end_date} onChange={(e) => handleChange("end_date", e.target.value)} />
              </div>
            </div>
            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium mb-2">Descrição *</label>
              <Textarea placeholder="Descreva em detalhe o trabalho a realizar..." value={formData.description} onChange={(e) => handleChange("description", e.target.value)} rows={4} />
            </div>
            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">{isSubmitting ? "Publicando..." : "Publicar Obra"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
