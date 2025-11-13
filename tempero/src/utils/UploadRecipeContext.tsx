import { createContext, useContext, useState } from "react";

export type UploadIngredient = { id?: string; name: string; amount: number; unit?: string; note?: string };
export type UploadStep = { id?: string; index: number; description: string };
export type UploadForm = {
  title: string;
  short_description?: string;
  preparation_time?: number | null;
  cooking_time?: number | null;
  servings?: number | null;
  difficulty?: number | null;
  ingredients: UploadIngredient[];
  steps: UploadStep[];
  imageFile?: File | null;
};

type Context = {
  form: UploadForm;
  setForm: (fn: (prev: UploadForm) => UploadForm) => void;
  reset: () => void;
};

const defaultForm: UploadForm = {
  title: "",
  short_description: "",
  preparation_time: null,
  cooking_time: null,
  servings: null,
  difficulty: null,
  ingredients: [],
  steps: [],
  imageFile: null,
};

const UploadRecipeContext = createContext<Context | undefined>(undefined);

export function UploadRecipeProvider({ children }: { children: React.ReactNode }) {
  const [form, setFormState] = useState<UploadForm>(defaultForm);

  const setForm = (fn: (prev: UploadForm) => UploadForm) => setFormState(fn);
  const reset = () => setFormState(defaultForm);

  return (
    <UploadRecipeContext.Provider value={{ form, setForm, reset }}>
      {children}
    </UploadRecipeContext.Provider>
  );
}

export function useUploadRecipe() {
  const ctx = useContext(UploadRecipeContext);
  if (!ctx) throw new Error("useUploadRecipe must be used within UploadRecipeProvider");
  return ctx;
}

export default UploadRecipeContext;
