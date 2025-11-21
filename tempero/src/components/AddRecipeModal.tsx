import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";

type Props = {
  listId: string;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddRecipeModal({ listId, onClose, onAdded }: Props) {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("recipes").select("*");
      setRecipes(data || []);
      setLoading(false);
    })();
  }, []);

  async function addRecipe(recipeId: string) {
    setAdding(true);

    await supabase.from("list_recipes").insert({
      list_id: listId,
      recipe_id: recipeId,
    });

    setAdding(false);
    onAdded();
    onClose();
  }

  return (
    <div
      className="
      fixed inset-0 bg-black/40 backdrop-blur-sm
      flex items-center justify-center z-50
    "
    >
      <div
        className="
        w-full max-w-lg bg-white rounded-xl p-6 
        border border-secondary/30 shadow-xl
      "
      >
        <h2 className="font-heading-styled text-2xl text-secondary mb-4">
          Add Recipes
        </h2>

        {loading ? (
          <p className="font-body text-dark">Loading recipes…</p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-3">
            {recipes.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center p-3
                  rounded-lg border bg-bright border-dark/10"
              >
                <span className="font-body text-dark">{r.title}</span>

                <button
                  onClick={() => addRecipe(r.id)}
                  className="
                    bg-main hover:bg-secondary text-bright
                    px-3 py-1 rounded-md font-heading-styled
                  "
                  disabled={adding}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="
            mt-5 w-full bg-dark/20 hover:bg-dark/30 
            text-dark font-body py-2 rounded-lg
          "
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
