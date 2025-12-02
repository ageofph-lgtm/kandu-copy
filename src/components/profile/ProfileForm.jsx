import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  X, 
  Plus, 
  User, 
  Building2,
  MapPin
} from "lucide-react";

const CATEGORIES = [
  "Pintura",
  "Eletricidade",
  "Canalização", 
  "Alvenaria",
  "Ladrilhador",
  "Carpintaria",
  "Climatização",
  "Isolamentos",
  "Pavimentos",
  "Telhados"
];

const CITIES = [
  "Lisboa",
  "Porto", 
  "Braga",
  "Coimbra",
  "Aveiro",
  "Faro",
  "Setúbal",
  "Viseu",
  "Leiria",
  "Évora"
];

export default function ProfileForm({ user, onSave, onCancel, isFirstTime }) {
  const [formData, setFormData] = useState({
    user_type: user?.user_type || "",
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    city: user?.city || "",
    company: user?.company || "",
    nif: user?.nif || "",
    skills: user?.skills || [],
    service_areas: user?.service_areas || []
  });

  const [newSkill, setNewSkill] = useState("");
  const [newArea, setNewArea] = useState("");

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addArea = () => {
    if (newArea && !formData.service_areas.includes(newArea)) {
      setFormData(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, newArea]
      }));
      setNewArea("");
    }
  };

  const removeArea = (areaToRemove) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter(area => area !== areaToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.user_type) {
      alert("Por favor, selecione o tipo de utilizador");
      return;
    }
    
    if (!formData.full_name) {
      alert("Por favor, introduza o seu nome");
      return;
    }

    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFirstTime ? <User className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {isFirstTime ? "Configurar Perfil" : "Editar Perfil"}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de utilizador */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tipo de conta *
            </label>
            <Select 
              value={formData.user_type} 
              onValueChange={(value) => handleChange("user_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profissional
                  </div>
                </SelectItem>
                <SelectItem value="employer">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Empregador
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome completo *
            </label>
            <Input
              placeholder="O seu nome completo"
              value={formData.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Telefone
            </label>
            <Input
              placeholder="912 345 678"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Cidade
            </label>
            <Select value={formData.city} onValueChange={(value) => handleChange("city", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a sua cidade" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {city}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campos específicos para empregadores */}
          {formData.user_type === 'employer' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Empresa
                </label>
                <Input
                  placeholder="Nome da empresa"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  NIF
                </label>
                <Input
                  placeholder="123 456 789"
                  value={formData.nif}
                  onChange={(e) => handleChange("nif", e.target.value)}
                />
              </div>
            </>
          )}

          {/* Campos específicos para profissionais */}
          {formData.user_type === 'worker' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Competências
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={newSkill} onValueChange={setNewSkill}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Adicionar competência" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(cat => !formData.skills.includes(cat)).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addSkill} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Áreas de atuação */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Áreas de atuação
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select value={newArea} onValueChange={setNewArea}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Adicionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.filter(city => !formData.service_areas.includes(city)).map((city) => (
                      <SelectItem key={city} value={city}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {city}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addArea} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.service_areas.map((area) => (
                  <Badge key={area} variant="outline" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {area}
                    <button
                      type="button"
                      onClick={() => removeArea(area)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Sobre mim
            </label>
            <Textarea
              placeholder="Conte um pouco sobre si, experiência, especialidades..."
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            {!isFirstTime && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
            <Button type="submit" className={`${isFirstTime ? 'w-full' : 'flex-1'} bg-blue-600 hover:bg-blue-700`}>
              <Save className="w-4 h-4 mr-2" />
              {isFirstTime ? "Criar Perfil" : "Guardar Alterações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}