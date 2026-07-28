import { toast } from "sonner";
import { User } from "@/api/entities";
import { useState, useRef } from "react";
import { UploadFile } from "@/api/integrations";
import { Plus, X, Image as ImageIcon, ExternalLink, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import { validateFile, resizeImage, IMAGE_MIME_TYPES } from "@/lib/validation";

/** Mínimo exigido pelo wireframe para o portfólio do profissional (#8). */
export const MIN_PORTFOLIO_PHOTOS = 3;

export default function PortfolioGallery({ images = [], onUpdate, canEdit }) {
  const { lang } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const missing = Math.max(0, MIN_PORTFOLIO_PHOTOS - images.length);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";               // permite reenviar o mesmo ficheiro
    if (!files.length) return;

    // #39 — validação de formato antes de enviar
    for (const file of files) {
      const check = validateFile(file, { accept: IMAGE_MIME_TYPES });
      if (!check.ok) { toast.error(check.error); return; }
    }

    setIsUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const resized = await resizeImage(file, { maxSize: 1280, quality: 0.85 });
        const { file_url } = await UploadFile({ file: resized });
        urls.push(file_url);
      }
      const next = [...images, ...urls];
      // FIX #8: a coluna na BD chama-se `portfolio` (era gravado em
      // `portfolio_images`, que não existe — o update falhava em silêncio).
      await User.updateMyUserData({ portfolio: next });
      onUpdate?.(next);
      toast.success(
        next.length >= MIN_PORTFOLIO_PHOTOS
          ? "Portfólio atualizado ✓"
          : `Faltam ${MIN_PORTFOLIO_PHOTOS - next.length} foto(s) para completar o portfólio.`
      );
    } catch (e) {
      console.error("Portfolio upload error:", e);
      toast.error("Não foi possível enviar as fotos: " + (e.message || "erro desconhecido"));
    }
    setIsUploading(false);
  };

  const handleRemoveImage = async (imageUrl) => {
    if (!window.confirm("Remover esta foto do portfólio?")) return;
    try {
      const next = images.filter(i => i !== imageUrl);
      await User.updateMyUserData({ portfolio: next });
      onUpdate?.(next);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível remover a foto.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ImageIcon size={16} style={{ color: "#F26522" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
            {t(lang, "portfolio", "Portfólio")} ({images.length}/{MIN_PORTFOLIO_PHOTOS})
          </span>
        </div>
        {canEdit && (
          <>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
              onChange={handleFileUpload} style={{ display: "none" }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "#F26522", color: "#fff",
                border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                cursor: isUploading ? "wait" : "pointer",
              }}>
              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              {isUploading ? "A enviar..." : "Adicionar"}
            </button>
          </>
        )}
      </div>

      {canEdit && missing > 0 && (
        <div style={{
          background: "#F59E0B18", border: "1px solid #F59E0B44", borderRadius: 10,
          padding: "8px 12px", marginBottom: 10,
        }}>
          <p style={{ margin: 0, color: "#F59E0B", fontSize: 12, fontWeight: 600 }}>
            📷 Adiciona mais {missing} foto(s) — o portfólio só fica completo com {MIN_PORTFOLIO_PHOTOS} fotos.
          </p>
        </div>
      )}

      {images.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text2)" }}>
          <ImageIcon size={40} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 13 }}>Nenhuma foto no portfólio</p>
          {canEdit && <p style={{ margin: "4px 0 0", fontSize: 11 }}>JPG, PNG ou WEBP · máx. 8 MB por foto</p>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {images.map((url, i) => (
            <div key={url + i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: "var(--surface2)" }}>
              <img src={url} alt={`Portfólio ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                onClick={() => window.open(url, "_blank")} />
              {canEdit && (
                <button onClick={() => handleRemoveImage(url)} aria-label="Remover foto"
                  style={{
                    position: "absolute", top: 4, right: 4, background: "#ef4444", border: "none",
                    borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", color: "#fff",
                  }}>
                  <X size={11} />
                </button>
              )}
              <button onClick={() => window.open(url, "_blank")} aria-label="Abrir foto"
                style={{
                  position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.5)", border: "none",
                  borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", color: "#fff",
                }}>
                <ExternalLink size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
