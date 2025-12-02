import React, { useState } from "react";
import { UploadFile } from "@/integrations/Core";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  X, 
  Upload, 
  Image as ImageIcon,
  ExternalLink
} from "lucide-react";

export default function PortfolioGallery({ images = [], onUpdate, canEdit }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione apenas imagens");
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const newImages = [...images, file_url];
      
      await User.updateMyUserData({ portfolio_images: newImages });
      onUpdate();
      alert("Imagem adicionada ao portfólio!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao fazer upload da imagem");
    }
    setIsUploading(false);
  };

  const handleRemoveImage = async (imageUrl) => {
    if (!confirm("Tem a certeza que quer remover esta imagem?")) return;
    
    try {
      const newImages = images.filter(img => img !== imageUrl);
      await User.updateMyUserData({ portfolio_images: newImages });
      onUpdate();
      alert("Imagem removida do portfólio!");
    } catch (error) {
      console.error("Error removing image:", error);
      alert("Erro ao remover imagem");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Portfólio
        </CardTitle>
        
        {canEdit && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              size="sm"
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma imagem no portfólio</p>
            {canEdit && (
              <p className="text-sm mt-1">
                Adicione imagens dos seus trabalhos para mostrar a qualidade
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imageUrl}
                    alt={`Portfólio ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                </div>
                
                {canEdit && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-6 h-6"
                      onClick={() => handleRemoveImage(imageUrl)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-6 h-6"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}