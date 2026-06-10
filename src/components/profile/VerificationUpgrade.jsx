import { useState } from "react";
import { BadgeCheck, Upload, CheckCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";

export default function VerificationUpgrade({ user, onUpdate }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const level = user?.verified_level || "basic";
  if (level === "ultra_verified") return null;

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ id_document_url: file_url, id_document_status: "pending", verified_level: "ultra_verified" });
      setUploaded(true);
      onUpdate?.();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const steps = [
    { label: t(lang,"verifyBasic"), done: true },
    { label: t(lang,"verifyEmail"), done: level !== "basic" },
    { label: t(lang,"verifyUltra"), done: level === "ultra_verified" || uploaded },
  ];

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 hover:border-[#F26522] hover:bg-orange-50 transition-colors text-left">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <BadgeCheck className="w-5 h-5 text-[#F26522]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{t(lang,"getUltraVerified")}</p>
          <p className="text-xs text-gray-500">{t(lang,"getUltraVerifiedDesc")}</p>
        </div>
        <span className="text-xs text-[#F26522] font-medium">→</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-green-600" />
              {t(lang,"identityVerification")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className={"flex items-center gap-2 p-2 rounded-lg " + (step.done ? "bg-green-50" : "bg-gray-50")}>
                  <CheckCircle className={"w-4 h-4 " + (step.done ? "text-green-500" : "text-gray-300")} />
                  <span className={"text-sm " + (step.done ? "text-green-700 font-medium" : "text-gray-500")}>{step.label}</span>
                </div>
              ))}
            </div>
            {!uploaded ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{t(lang,"verifyDocHint")}</p>
                <label className="block w-full cursor-pointer">
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocumentUpload} disabled={uploading} />
                  <div className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#F26522] transition-colors">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin text-[#F26522]" /> : <Upload className="w-5 h-5 text-gray-400" />}
                    <span className="text-sm text-gray-600">{uploading ? t(lang,"loading") : t(lang,"uploadDoc")}</span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-700 font-medium">{t(lang,"docSent")}</p>
              </div>
            )}
            <p className="text-xs text-gray-400 text-center">🔒 {t(lang,"gdprNote")}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
