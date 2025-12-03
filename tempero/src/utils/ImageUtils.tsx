import { supabase } from "../config/supabaseClient";

export async function uploadImage(file: File, folder: string) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("images")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  return path; // e.g. "recipes/1763309189136.jpeg"
}

export async function deleteImage(path: string) {
  const { error } = await supabase.storage.from("images").remove([path]);
  if (error) throw error;
}