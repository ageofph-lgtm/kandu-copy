import React, { useState } from "react";
import { UploadFile } from "@/integrations/Core";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Download,
  Shield
} from "lucide-react";

export default function DocumentsList({ documents = [], onUpdate, canEdit }) {
  const [isUploading, setIsUploading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const fileInputRef = React.useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!documentName.trim()) {
      alert("Por favor, insira um nome para o documento");
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const newDocument = {
        name: documentName.trim(),
        url: file_url,
        type: file.type.includes('pdf') ? 'pdf' : 'document'
      };
      
      const newDocuments = [...documents, newDocument];
      await User.updateMyUserData({ documents: newDocuments });
      
      setShowAddDialog(false);
      setDocumentName("");
      onUpdate();
      alert("Documento adicionado com sucesso!");
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Erro ao fazer upload do documento");
    }
    setIsUploading(false);
  };

  const handleRemoveDocument = async (documentIndex) => {
    if (!confirm("Tem a certeza que quer remover este documento?")) return;
    
    try {
      const newDocuments = documents.filter((_, index) => index !== documentIndex);
      await User.updateMyUserData({ documents: newDocuments });
      onUpdate();
      alert("Documento removido!");
    } catch (error) {
      console.error("Error removing document:", error);
      alert("Erro ao remover documento");
    }
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'pdf':
        return '📄';
      default:
        return '📋';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documentos
        </CardTitle>
        
        {canEdit && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nome do documento
                  </label>
                  <Input
                    placeholder="Ex: Certificado profissional, Seguro, etc."
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Arquivo
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    variant="outline"
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar arquivo
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500">
                  Formatos aceites: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum documento anexado</p>
            {canEdit && (
              <p className="text-sm mt-1">
                Adicione certificados, seguros ou outros documentos relevantes
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getDocumentIcon(document.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{document.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {document.type.toUpperCase()}
                      </Badge>
                      <Shield className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-gray-500">Verificado</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => window.open(document.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleRemoveDocument(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}