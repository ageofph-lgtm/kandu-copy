import React, { useState, useRef } from "react";
import { UploadFile } from "@/integrations/Core";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  X,
  Upload,
  FileText,
  ExternalLink,
  Shield,
  Loader2,
  GraduationCap,
  IdCard,
  FileCheck,
  FileBadge,
  Briefcase,
} from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "diploma", label: "Diploma / Certificado", icon: "🎓" },
  { value: "bi", label: "Cartão de Cidadão / BI", icon: "🪪" },
  { value: "nif", label: "NIF / Comprovativo Fiscal", icon: "📋" },
  { value: "seguro", label: "Seguro Profissional", icon: "🛡️" },
  { value: "cnh", label: "Carta de Condução", icon: "🚗" },
  { value: "certificado", label: "Certificado Profissional", icon: "📜" },
  { value: "portfolio", label: "Portfólio / Obra", icon: "🏗️" },
  { value: "contrato", label: "Contrato / Recibo", icon: "📄" },
  { value: "outro", label: "Outro", icon: "📎" },
];

function getDocIcon(type) {
  return DOCUMENT_TYPES.find(d => d.value === type)?.icon || "📎";
}
function getDocLabel(type) {
  return DOCUMENT_TYPES.find(d => d.value === type)?.label || type;
}

export default function DocumentsList({ documents = [], onUpdate, canEdit }) {
  const [isUploading, setIsUploading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!docName.trim()) { alert("Insira um nome para o documento"); return; }
    if (!docType) { alert("Selecione o tipo de documento"); return; }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });

      const newDoc = {
        name: docName.trim(),
        url: file_url,
        type: docType,
        uploaded_at: new Date().toISOString(),
      };

      const updated = [...documents, newDoc];
      await User.updateMyUserData({ documents: updated });

      // Sync to Supabase
      try { await base44.functions.invoke('syncCurrentUserToSupabase', {}); } catch(e) {}

      setShowDialog(false);
      setDocName("");
      setDocType("");
      onUpdate();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do documento");
    }
    setIsUploading(false);
  };

  const handleRemove = async (idx) => {
    if (!confirm("Remover este documento?")) return;
    const updated = documents.filter((_, i) => i !== idx);
    await User.updateMyUserData({ documents: updated });
    try { await base44.functions.invoke('syncCurrentUserToSupabase', {}); } catch(e) {}
    onUpdate();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#F26522]" />
          Documentos
        </h2>
        {canEdit && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#F26522] hover:bg-orange-600 rounded-xl">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Adicionar Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Tipo de documento</label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(dt => (
                        <SelectItem key={dt.value} value={dt.value}>
                          <span className="flex items-center gap-2">
                            <span>{dt.icon}</span> {dt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Nome / Descrição</label>
                  <Input
                    placeholder="Ex: Diploma Elétrica, Seguro 2024..."
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !docName.trim() || !docType}
                  className="w-full bg-[#F26522] hover:bg-orange-600"
                >
                  {isUploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A enviar...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Selecionar ficheiro</>
                  )}
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  PDF, DOC, JPG, PNG — máx. 10MB
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum documento adicionado</p>
          {canEdit && (
            <p className="text-xs mt-1 text-gray-400">Adicione diplomas, seguros ou documentos pessoais</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{getDocIcon(doc.type)}</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{getDocLabel(doc.type)}</span>
                    <Shield className="w-3 h-3 text-green-500 shrink-0" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => window.open(doc.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </Button>
                {canEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-400 hover:text-red-600"
                    onClick={() => handleRemove(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}