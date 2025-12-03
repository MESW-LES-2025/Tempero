import { supabase } from "../config/supabaseClient";
import { compressImage } from "./CompressImage";

export async function uploadImage(file: File, folder: string) {
  const compressed = await compressImage(file);
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("images")
    .upload(path, compressed, { upsert: true });

  if (error) throw error;

  return path; // e.g. "recipes/1763309189136.jpeg"
}

export async function deleteImage(path: string) {
  const { error } = await supabase.storage.from("images").remove([path]);
  if (error) throw error;
}