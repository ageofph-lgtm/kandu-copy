import { toast } from "sonner";
import { User } from "@/api/entities";
import React, { useState } from "react";
import { UploadFile } from "@/api/integrations";
import { Plus, X, Upload, Image as ImageIcon, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";

// Formatos aceites (#39) e mínimo recomendado de fotos de trabalho (#8)
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MIN_PORTFOLIO_IMAGES = 3;

export default function PortfolioGallery({ images = [], onUpdate, canEdit }) {
  const { lang } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const invalid = files.find(f => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (invalid) {
      toast.error(t(lang, "portfolioFormatError", "Formato não suportado. Usa JPG ou PNG."));
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await UploadFile({ file });
        uploaded.push(file_url);
      }
      await User.updateMyUserData({ portfolio_images: [...images, ...uploaded] });
      onUpdate();
      toast.success(t(lang,"success"));
    } catch (e) {
      console.error("Portfolio upload failed:", e);
      toast.error(t(lang,"error"));
    }
    setIsUploading(false);
  };

  const handleRemoveImage = async (imageUrl) => {
    if (!confirm(t(lang,"delete") + "?")) return;
    try {
      await User.updateMyUserData({ portfolio_images: images.filter(i => i !== imageUrl) });
      onUpdate();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <ImageIcon size={16} style={{ color:"#F26522" }} />
          <span style={{ fontWeight:700, fontSize:14 }}>{t(lang,"portfolio")}</span>
        </div>
        {canEdit && (
          <>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{ display:"flex", alignItems:"center", gap:6, background:"#111", color:"#fff",
                border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}
            >
              {isUploading ? <Upload size={13} className="animate-spin" /> : <Plus size={13} />}
              {isUploading ? t(lang,"loading") : t(lang,"add")}
            </button>
          </>
        )}
      </div>

      {canEdit && images.length < MIN_PORTFOLIO_IMAGES && (
        <div style={{ background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:10, padding:"8px 12px", marginBottom:12 }}>
          <p style={{ margin:0, fontSize:12, color:"#92400E" }}>
            {t(lang, "portfolioMinHint", "Adiciona pelo menos {min} fotos de trabalhos ({n}/{min}) para o teu perfil ficar completo.")
              .replace(/{min}/g, MIN_PORTFOLIO_IMAGES).replace("{n}", images.length)}
          </p>
        </div>
      )}

      {images.length === 0 ? (
        <div style={{ textAlign:"center", padding:"32px 0", color:"#aaa" }}>
          <ImageIcon size={40} style={{ margin:"0 auto 8px", opacity:0.3 }} />
          <p style={{ margin:0, fontSize:13 }}>{t(lang,"noPortfolioImages")}</p>
          {canEdit && <p style={{ margin:"4px 0 0", fontSize:11 }}>{t(lang,"addPortfolioHint")}</p>}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {images.map((url, i) => (
            <div key={i} style={{ position:"relative", aspectRatio:"1", borderRadius:10, overflow:"hidden", background:"#f0f0f0" }}>
              <img src={url} alt={"p"+i} style={{ width:"100%", height:"100%", objectFit:"cover", cursor:"pointer" }}
                onClick={() => window.open(url,"_blank")} />
              {canEdit && (
                <button onClick={() => handleRemoveImage(url)}
                  style={{ position:"absolute", top:4, right:4, background:"#ef4444", border:"none",
                    borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center",
                    justifyContent:"center", cursor:"pointer", color:"#fff" }}>
                  <X size={11} />
                </button>
              )}
              <button onClick={() => window.open(url,"_blank")}
                style={{ position:"absolute", bottom:4, right:4, background:"rgba(0,0,0,0.5)", border:"none",
                  borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center",
                  justifyContent:"center", cursor:"pointer", color:"#fff" }}>
                <ExternalLink size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
