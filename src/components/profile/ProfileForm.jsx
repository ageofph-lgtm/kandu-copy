import { toast } from "sonner";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
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
  "Mão de Obra",
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

// Os valores de CATEGORIES são canónicos (guardados na DB em PT);
// este mapa dá a chave i18n usada só para exibição.
const CATEGORY_I18N = {
  "Mão de Obra": "labor",
  "Pintura": "painting",
  "Eletricidade": "electricity",
  "Canalização": "plumbing",
  "Alvenaria": "masonry",
  "Ladrilhador": "tiling",
  "Carpintaria": "carpentry",
  "Climatização": "hvac",
  "Isolamentos": "insulation",
  "Pavimentos": "flooring",
  "Telhados": "roofing",
};
const categoryLabel = (lang, pt) => t(lang, CATEGORY_I18N[pt] || pt, pt);

export default function ProfileForm({ user, onSave, onCancel, isFirstTime }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    user_type: user?.user_type || "",
    employer_type: user?.employer_type || "",
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    city: user?.city || "",
    company: user?.company || "",
    nif: user?.nif || "",
    skills: user?.skills || [],
    service_areas: user?.service_areas || [],
    company_clients: user?.company_clients || []
  });
  const [newClient, setNewClient] = useState({ name: '', contact: '', nif: '' });

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
      toast.error(t(lang, "selectUserTypeError", "Por favor, selecione o tipo de utilizador"));
      return;
    }

    if (!formData.full_name) {
      toast.error(t(lang, "enterNameError", "Por favor, introduza o seu nome"));
      return;
    }

    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFirstTime ? <User className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {isFirstTime ? t(lang, "setupProfile", "Configurar Perfil") : t(lang, "editProfile", "Editar Perfil")}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de utilizador */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t(lang, "accountType", "Tipo de conta")} *
            </label>
            <Select
              value={formData.user_type}
              onValueChange={(value) => handleChange("user_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t(lang, "selectAccountType", "Selecione o tipo de conta")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t(lang, "worker", "Profissional")}
                  </div>
                </SelectItem>
                <SelectItem value="employer">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {t(lang, "employer", "Empregador")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t(lang, "fullName", "Nome completo")} *
            </label>
            <Input
              placeholder={t(lang, "fullNamePlaceholder", "O seu nome completo")}
              value={formData.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t(lang, "phone", "Telefone")}
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
              {t(lang, "city", "Cidade")}
            </label>
            <Select value={formData.city} onValueChange={(value) => handleChange("city", value)}>
              <SelectTrigger>
                <SelectValue placeholder={t(lang, "selectYourCity", "Selecione a sua cidade")} />
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
              {/* Tipo de empregador */}
              <div>
                <label className="block text-sm font-medium mb-2">{t(lang, "employerTypeLabel", "Tipo de Empregador")} *</label>
                <div className="flex gap-3">
                  {[{ value: 'simple', label: 'Simple Employer', desc: t(lang, "privateClient", "Cliente Particular") }, { value: 'cia', label: 'Cia Employer', desc: t(lang, "companyLabel", "Empresa") }].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleChange('employer_type', opt.value)}
                      className={`flex-1 rounded-xl border-2 p-3 text-left transition-all ${
                        formData.employer_type === opt.value ? 'border-[#F26522] bg-orange-50' : 'border-gray-200'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t(lang, "companyLabel", "Empresa")}</label>
                <Input
                  placeholder={t(lang, "companyNamePlaceholder", "Nome da empresa")}
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">NIF</label>
                <Input
                  placeholder="123 456 789"
                  value={formData.nif}
                  onChange={(e) => handleChange("nif", e.target.value)}
                />
              </div>

              {/* Clients Section — apenas para Cia */}
              {formData.employer_type === 'cia' && (
                <div className="border border-purple-200 rounded-xl p-4 bg-purple-50">
                  <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" /> Clients Section
                  </p>
                  {formData.company_clients.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 mb-2 border border-purple-100">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.contact}{c.nif ? ` · NIF ${c.nif}` : ''}</p>
                      </div>
                      <button type="button" onClick={() => handleChange('company_clients', formData.company_clients.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="space-y-2 mt-2">
                    <Input placeholder={t(lang, "clientNamePlaceholder", "Nome do cliente") + " *"} value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} />
                    <Input placeholder={t(lang, "contactLabel", "Contacto")} value={newClient.contact} onChange={e => setNewClient(p => ({ ...p, contact: e.target.value }))} />
                    <Input placeholder={t(lang, "clientNifPlaceholder", "NIF do cliente")} value={newClient.nif} onChange={e => setNewClient(p => ({ ...p, nif: e.target.value }))} />
                    <Button type="button" variant="outline" className="w-full border-dashed border-purple-300 text-purple-600" disabled={!newClient.name}
                      onClick={() => {
                        if (!newClient.name) return;
                        handleChange('company_clients', [...formData.company_clients, { ...newClient }]);
                        setNewClient({ name: '', contact: '', nif: '' });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" /> {t(lang, "addClient", "Adicionar cliente")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Campos específicos para profissionais */}
          {formData.user_type === 'worker' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t(lang, "skills", "Competências")}
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={newSkill} onValueChange={setNewSkill}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t(lang, "addSkill", "Adicionar competência")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(cat => !formData.skills.includes(cat)).map((category) => (
                        <SelectItem key={category} value={category}>
                          {categoryLabel(lang, category)}
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
                      {categoryLabel(lang, skill)}
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
              {t(lang, "serviceAreas", "Áreas de atuação")}
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select value={newArea} onValueChange={setNewArea}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t(lang, "addArea", "Adicionar área")} />
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
              {t(lang, "bio", "Sobre mim")}
            </label>
            <Textarea
              placeholder={t(lang, "bioPlaceholder", "Conte um pouco sobre si, experiência, especialidades...")}
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            {!isFirstTime && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                {t(lang, "cancel", "Cancelar")}
              </Button>
            )}
            <Button type="submit" className={`${isFirstTime ? 'w-full' : 'flex-1'} bg-blue-600 hover:bg-blue-700`}>
              <Save className="w-4 h-4 mr-2" />
              {isFirstTime ? t(lang, "createProfile", "Criar Perfil") : t(lang, "saveChanges", "Guardar Alterações")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}