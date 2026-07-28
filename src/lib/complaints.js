import { supabase } from "@/api/supabaseClient";

/**
 * Reclamações e denúncias (#14, #16, #28, #79, #80).
 * A penalização de XP e o bloqueio da obra são aplicados server-side pela
 * função `file_complaint` — o cliente nunca mexe em XP.
 */

export const COMPLAINT_TYPES = [
  {
    value: "complaint",
    label: "Reclamação",
    icon: "⚠️",
    description: "Problema com a obra, pagamento ou comportamento",
    penalty: 0,
  },
  {
    value: "no_show",
    label: "Não compareceu",
    icon: "🚫",
    description: "A outra parte não apareceu na obra",
    penalty: 1000,
  },
  {
    value: "fake_job",
    label: "Anúncio falso",
    icon: "🎭",
    description: "O anúncio não corresponde à realidade",
    penalty: 1000,
  },
];

export async function fileComplaint({
  reporterId, type, jobId = null, reportedId = null,
  reason = null, description = null, evidenceUrl = null,
}) {
  const { data, error } = await supabase.rpc("file_complaint", {
    p_reporter_id: reporterId,
    p_type: type,
    p_job_id: jobId,
    p_reported_id: reportedId,
    p_reason: reason,
    p_description: description,
    p_evidence_url: evidenceUrl,
  });
  if (error) throw error;
  return data;
}

export async function listMyComplaints(userId) {
  const { data, error } = await supabase.from("complaints")
    .select("*").eq("reporter_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listComplaintsForJob(jobId) {
  const { data, error } = await supabase.from("complaints")
    .select("*").eq("job_id", jobId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
