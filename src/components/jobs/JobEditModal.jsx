import { useState, useRef } from "react";
import { toast } from "sonner";
import { Job } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { X, Lock, Eye, Loader2 } from "lucide-react";
import {
  requireFields, isValidDateRange, validateFile, resizeImage, IMAGE_MIME_TYPES,
} from "@/lib/validation";

const OR = "#FF6600";

const CATEGORIES = [
  "Pintura", "Eletricidade", "Canalização", "Alvenaria", "Azulejista", "Carpintaria",
  "Climatização", "Serralharia", "Jardinagem", "Impermeabilizador", "Estucador",
  "Montador de Andaimes",
];

/** Estados em que a obra já não pode ser editada (#66). */
const LOCKED_STATUS = ["in_progress", "completed_by_employer", "completed", "cancelled"];

/**
 * Ver detalhes / editar anúncio (#54) e publicar rascunhos (#53).
 *
 * Quando o profissional já iniciou o trabalho o anúncio fica em modo apenas
 * leitura — mudar preço ou âmbito a meio da obra é o problema levantado em #66.
 */
export default function JobEditModal({ job, onClose, onSaved, mode = "edit" }) {
  const readOnly = mode === "view" || LOCKED_STATUS.includes(job.status);
  const [form, setForm] = useState({
    title: job.title || "",
    category: job.category || "",
    description: job.description || "",
    location: job.location || "",
    start_date: job.start_date ? String(job.start_date).slice(0, 10) : "",
    end_date: job.end_date ? String(job.end_date).slice(0, 10) : "",
    price: job.price ?? "",
    price_type: job.price_type || "fixed",
    urgency: job.urgency || "medium",
  });
  const [photos, setPhotos] = useState(Array.isArray(job.photos) ? job.photos : []);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => (p[k] ? { ...p, [k]: undefined } : p));
  };

  const validate = () => {
    const e = requireFields(form, [
      { name: "title", label: "O título", validate: v => v.trim().length < 5 ? "Título demasiado curto." : null },
      { name: "category", label: "A categoria" },
      { name: "description", label: "A descrição", validate: v => v.trim().length < 20 ? "Descreve com pelo menos 20 caracteres." : null },
      { name: "location", label: "A localização" },
      { name: "start_date", label: "A data de início" },
      { name: "end_date", label: "A data de fim" },
      { name: "price", label: "O valor", validate: v => (isNaN(parseFloat(v)) || parseFloat(v) <= 0) ? "Valor inválido." : null },
    ]);
    if (!e.end_date && !isValidDateRange(form.start_date, form.end_date)) {
      e.end_date = "A data de fim não pode ser anterior à de início.";
    }
    if (photos.length < 3) e.photos = `Adiciona pelo menos 3 fotos da área de trabalho (tens ${photos.length}).`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhotos = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    for (const file of files) {
      const check = validateFile(file, { accept: IMAGE_MIME_TYPES });
      if (!check.ok) { toast.error(check.error); return; }
    }
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const resized = await resizeImage(file, { maxSize: 1600, quality: 0.85 });
        const { file_url } = await UploadFile({ file: resized });
        urls.push(file_url);
      }
      setPhotos(prev => [...prev, ...urls]);
      setErrors(p => ({ ...p, photos: undefined }));
    } catch (e) {
      toast.error("Erro ao enviar fotos: " + (e.message || ""));
    }
    setUploading(false);
  };

  const save = async (publish = false) => {
    if (!validate()) { toast.error("Corrige os campos assinalados."); return; }
    setSaving(true);
    try {
      await Job.update(job.id, {
        ...form,
        price: parseFloat(form.price),
        photos,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        ...(publish ? { status: "open", published_at: new Date().toISOString() } : {}),
      });
      toast.success(publish ? "Obra publicada ✓" : "Anúncio atualizado ✓");
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error("Erro ao guardar: " + (e.message || ""));
    }
    setSaving(false);
  };

  const surface = "var(--surface2)", bg = "var(--base)", text = "var(--text)";
  const subtext = "var(--text2)", border = "var(--hair)";
  const input = (invalid) => ({
    width: "100%", padding: "11px 13px", borderRadius: 10,
    border: `1.5px solid ${invalid ? "#EF4444" : border}`,
    background: readOnly ? surface : bg, color: text, fontSize: 14,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  });
  const label = { display: "block", fontSize: 11, fontWeight: 700, color: subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 };
  const Err = ({ name }) => errors[name] ? <p style={{ color: "#EF4444", fontSize: 12, margin: "5px 0 0" }}>⚠️ {errors[name]}</p> : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 1, background: bg, width: "100%", maxWidth: 540,
        borderRadius: "20px 20px 0 0", maxHeight: "92vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: text, flex: 1 }}>
            {readOnly ? "Detalhes do anúncio" : job.status === "draft" ? "Rascunho" : "Editar anúncio"}
          </h2>
          <button onClick={onClose} aria-label="Fechar"
            style={{ background: "none", border: "none", cursor: "pointer", color: subtext, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {readOnly && (
          <div style={{ background: "#F59E0B15", borderBottom: "1px solid #F59E0B44", padding: "10px 20px", display: "flex", gap: 8, alignItems: "center" }}>
            {mode === "view" ? <Eye size={15} color="#F59E0B" /> : <Lock size={15} color="#F59E0B" />}
            <p style={{ margin: 0, fontSize: 12, color: "#F59E0B", lineHeight: 1.5 }}>
              {mode === "view"
                ? "Modo de consulta."
                : "O trabalho já começou — o anúncio não pode ser alterado. Fala com o profissional pelo chat para acertar detalhes."}
            </p>
          </div>
        )}

        <div style={{ overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={label}>Título *</label>
            <input style={input(errors.title)} value={form.title} disabled={readOnly}
              onChange={e => set("title", e.target.value)} />
            <Err name="title" />
          </div>

          <div>
            <label style={label}>Categoria *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map(c => (
                <button key={c} type="button" disabled={readOnly} onClick={() => set("category", c)}
                  style={{
                    padding: "7px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: readOnly ? "default" : "pointer",
                    border: `1px solid ${form.category === c ? OR : border}`,
                    background: form.category === c ? OR : "transparent",
                    color: form.category === c ? "#fff" : subtext,
                  }}>
                  {c}
                </button>
              ))}
            </div>
            <Err name="category" />
          </div>

          <div>
            <label style={label}>Descrição *</label>
            <textarea rows={4} style={{ ...input(errors.description), resize: "vertical" }} value={form.description}
              disabled={readOnly} onChange={e => set("description", e.target.value)} />
            <Err name="description" />
          </div>

          <div>
            <label style={label}>Localização *</label>
            <input style={input(errors.location)} value={form.location} disabled={readOnly}
              onChange={e => set("location", e.target.value)} />
            <Err name="location" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Data início *</label>
              <input type="date" style={input(errors.start_date)} value={form.start_date} disabled={readOnly}
                onChange={e => set("start_date", e.target.value)} />
              <Err name="start_date" />
            </div>
            <div>
              <label style={label}>Data fim *</label>
              <input type="date" style={input(errors.end_date)} value={form.end_date} disabled={readOnly}
                min={form.start_date || undefined} onChange={e => set("end_date", e.target.value)} />
              <Err name="end_date" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Valor (€) *</label>
              <input type="number" min="1" style={input(errors.price)} value={form.price} disabled={readOnly}
                onChange={e => set("price", e.target.value)} />
              <Err name="price" />
            </div>
            <div>
              <label style={label}>Tipo de preço</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ v: "fixed", l: "Projeto" }, { v: "hourly", l: "Hora" }, { v: "negotiable", l: "Neg." }].map(o => (
                  <button key={o.v} type="button" disabled={readOnly} onClick={() => set("price_type", o.v)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: readOnly ? "default" : "pointer",
                      border: `1px solid ${form.price_type === o.v ? OR : border}`,
                      background: form.price_type === o.v ? OR : "transparent",
                      color: form.price_type === o.v ? "#fff" : subtext,
                    }}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={label}>Fotos da área de trabalho * ({photos.length}/3)</label>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
              onChange={handlePhotos} style={{ display: "none" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {photos.map((url, i) => (
                <div key={url + i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: surface }}>
                  <img src={url} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {!readOnly && (
                    <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remover foto"
                      style={{ position: "absolute", top: 4, right: 4, background: "#EF4444", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", cursor: "pointer", fontSize: 12, lineHeight: 1 }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
              {!readOnly && photos.length < 9 && (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ aspectRatio: "1", borderRadius: 10, border: `2px dashed ${errors.photos ? "#EF4444" : OR}`, background: "transparent", color: OR, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : "+"}
                </button>
              )}
            </div>
            <Err name="photos" />
          </div>
        </div>

        {!readOnly && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${border}`, display: "flex", gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: 13, background: "transparent", border: `1px solid ${border}`, borderRadius: 12, color: subtext, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Cancelar
            </button>
            {job.status === "draft" && (
              <button onClick={() => save(false)} disabled={saving}
                style={{ flex: 1, padding: 13, background: "transparent", border: `1px solid ${OR}`, borderRadius: 12, color: OR, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Guardar rascunho
              </button>
            )}
            <button onClick={() => save(job.status === "draft")} disabled={saving}
              style={{ flex: 1, padding: 13, background: saving ? "#555" : OR, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "A guardar..." : job.status === "draft" ? "Publicar 🚀" : "Guardar ✓"}
            </button>
          </div>
        )}

        <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </div>
  );
}
