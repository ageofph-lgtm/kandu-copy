import { base44 } from './base44Client';
import { supabase } from './supabaseClient';

export const Core = base44.integrations.Core;
export const InvokeLLM = base44.integrations.Core.InvokeLLM;
export const SendEmail = base44.integrations.Core.SendEmail;
export const SendSMS = base44.integrations.Core.SendSMS;
export const GenerateImage = base44.integrations.Core.GenerateImage;
export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile;

// UploadFile via Supabase Storage (bucket: kandu-uploads)
export const UploadFile = async ({ file }) => {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from('kandu-uploads')
    .upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('kandu-uploads').getPublicUrl(fileName);
  return { file_url: publicUrl };
};
