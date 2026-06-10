import { useState } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/api/integrations";
import { FileText, X, Upload, Plus, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";

const DOC_TYPES_KEY = ["id_card","passport","work_permit","trade_license","insurance","certificate","other"];

export default function DocumentsList({ documents = [], onUpdate, canEdit }) {
  const { lang } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState("id_card");
  const [docLabel, setDocLabel] = useState("");
  const fileRef = useState(null);

  const DOC_TYPE_LABELS = {
    id_card: t(lang,"docIdCard"),
    passport: t(lang,"docPassport"),
    work_permit: t(lang,"docWorkPermit"),
    trade_license: t(lang,"docTradeLicense"),
    insurance: t(lang,"docInsurance"),
    certificate: t(lang,"docCertificate"),
    other: t(lang,"docOther"),
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const newDoc = { type: docType, label: docLabel || DOC_TYPE_LABELS[docType], url: file_url, uploaded_at: new Date().toISOString() };
      await User.updateMyUserData({ documents: [...documents, newDoc] });
      onUpdate();
      setShowForm(false);
      setDocLabel("");
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleRemove = async (idx) => {
    if (!confirm(t(lang,"confirmRemoveDoc"))) return;
    try {
      const newDocs = documents.filter((_, i) => i !== idx);
      await User.updateMyUserData({ documents: newDocs });
      onUpdate();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <FileText size={16} style={{ color:"#F26522" }} />
          <span style={{ fontWeight:700, fontSize:14 }}>{t(lang,"documents")}</span>
        </div>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{ display:"flex", alignItems:"center", gap:6, background:"#111", color:"#fff",
              border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}
          >
            <Plus size={13} /> {t(lang,"addDocument")}
          </button>
        )}
      </div>

      {/* Form upload */}
      {showForm && canEdit && (
        <div style={{ background:"#f9f9f9", borderRadius:10, padding:12, marginBottom:12 }}>
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #ddd", marginBottom:8, fontSize:13 }}
          >
            {DOC_TYPES_KEY.map(k => (
              <option key={k} value={k}>{DOC_TYPE_LABELS[k]}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder={t(lang,"docLabelPlaceholder")}
            value={docLabel}
            onChange={e => setDocLabel(e.target.value)}
            style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #ddd", marginBottom:8, fontSize:13, boxSizing:"border-box" }}
          />
          <label style={{ display:"block", cursor:"pointer" }}>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px",
              border:"2px dashed #ddd", borderRadius:8, color:"#888", fontSize:13 }}>
              <Upload size={15} />
              {uploading ? t(lang,"loading") : t(lang,"uploadDoc")}
            </div>
          </label>
          <button onClick={() => setShowForm(false)}
            style={{ marginTop:8, width:"100%", background:"transparent", border:"1px solid #ddd",
              borderRadius:8, padding:"6px", fontSize:12, cursor:"pointer", color:"#666" }}>
            {t(lang,"cancel")}
          </button>
        </div>
      )}

      {/* Lista de documentos */}
      {documents.length === 0 ? (
        <div style={{ textAlign:"center", padding:"24px 0", color:"#aaa" }}>
          <FileText size={36} style={{ margin:"0 auto 8px", opacity:0.3 }} />
          <p style={{ margin:0, fontSize:13 }}>{t(lang,"noDocuments")}</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {documents.map((doc, idx) => (
            <div key={idx} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
              background:"#f9f9f9", borderRadius:10, border:"1px solid #eee" }}>
              <FileText size={18} style={{ color:"#F26522", flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {doc.label || DOC_TYPE_LABELS[doc.type] || doc.type}
                </p>
                <p style={{ margin:0, fontSize:11, color:"#888" }}>
                  {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ""}
                </p>
              </div>
              <button onClick={() => window.open(doc.url,"_blank")}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#888", padding:4 }}>
                <ExternalLink size={15} />
              </button>
              {canEdit && (
                <button onClick={() => handleRemove(idx)}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", padding:4 }}>
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
