import { supabase } from "../config/supabaseClient";

export async function uploadImage(file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `recipes/${Date.now()}.${ext}`; // unique enough for now

  const { error } = await supabase.storage
    .from("images")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  return path; // e.g. "recipes/1763309189136.jpeg"
}
