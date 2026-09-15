import { supabase } from "./supabaseClient";

export async function getSignedUrl(bucket: string, path: string, expiresIn = 900) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
