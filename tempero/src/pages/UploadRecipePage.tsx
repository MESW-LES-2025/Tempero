import { useMemo, useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { UploadRecipeProvider, useUploadRecipe } from "../utils/UploadRecipeContext";
import { supabase } from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Units } from "../utils/Units";

function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function DetailsStep() {
    const { form, setForm } = useUploadRecipe();
    return (
        <div className="space-y-3">
            <label className="block">
                <div className=" font-heading mb-1">Title</div>
                <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none  transition-all duration-200 ease-in-out"
                    placeholder="Recipe title"
                />
            </label>

            <label className="block">
                <div className="font-heading">Short description</div>
                <textarea
                    value={form.short_description}
                    onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none  transition-all duration-200 ease-in-out"
                    rows={3}
                />
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="block">
                    <div className="font-heading mb-1">Preparation time (minutes)</div>
                    <input
                        type="number"
                        min={0}
                        value={form.preparation_time ?? ""}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                preparation_time: e.target.value ? parseInt(e.target.value, 10) : null,
                            }))
                        }
                        className="w-full rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                        placeholder="e.g. 15"
                    />
                </label>

                <label className="block">
                    <div className="font-heading mb-1">Cooking time (minutes)</div>
                    <input
                        type="number"
                        min={0}
                        value={form.cooking_time ?? ""}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                cooking_time: e.target.value ? parseInt(e.target.value, 10) : null,
                            }))
                        }
                        className="w-full rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                        placeholder="e.g. 30"
                    />
                </label>

                <label className="block">
                    <div className="font-heading mb-1">Servings</div>
                    <input
                        type="number"
                        min={1}
                        value={form.servings ?? ""}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                servings: e.target.value ? parseInt(e.target.value, 10) : null,
                            }))
                        }
                        className="w-full rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                        placeholder="e.g. 4"
                    />
                </label>

                <label className="block">
                    <div className="font-heading mb-1">Difficulty</div>
                    <select
                        value={form.difficulty ?? ""}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                difficulty: e.target.value ? parseInt(e.target.value, 10) : null,
                            }))
                        }
                        className="w-full rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                    >
                        <option value="">Select</option>
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={String(n)}>{n} {n===1? '— Very easy' : n===5? '— Very hard' : ''}</option>
                        ))}
                    </select>
                </label>
            </div>
        </div>
    );
}

function IngredientsStep() {
    const { form, setForm } = useUploadRecipe();

    function addIngredient() {
        // amount is now a number | null
        setForm((p) => ({ ...p, ingredients: [...p.ingredients, { id: makeId(), name: "", amount: 1, unit: "", note: "" }] }));
    }
    function updateIngredient(idx: number, patch: Partial<any>) {
        setForm((p) => {
            const ingredients = [...p.ingredients];
            ingredients[idx] = { ...ingredients[idx], ...patch };
            return { ...p, ingredients };
        });
    }
    function removeIngredient(idx: number) {
        setForm((p) => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) }));
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2">
                {form.ingredients.map((ing, i) => (
                    <div key={ing.id || i} className="space-y-1 mb-4">
                        <div className="flex gap-2">
                            <input
                                className="w-full rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                                value={ing.name}
                                onChange={(e) => updateIngredient(i, { name: e.target.value })}
                                placeholder="Ingredient"
                            />
                            <input
                                type="number"
                                min={0}
                                step="any"
                                className="w-20 rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                                value={ing.amount ?? ""}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    updateIngredient(i, { amount: v === "" ? null : parseFloat(v) });
                                }}
                                placeholder="Amt"
                            />
                            {/* unit select using predefined Units */}
                            <select
                                className="w-28 rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                                value={ing.unit ?? ""}
                                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                            >
                                <option value="">Unit</option>
                                {Units.map((u) => (
                                <option key={u.name} value={u.name}>
                                    {u.name}
                                </option>
                                ))}
                            </select>
                            <button type="button" onClick={() => removeIngredient(i)} className="px-3 py-1 text-red-600 hover:bg-red-50 rounded">✕</button>
                        </div>
                        <input
                            className="w-full rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                            value={ing.note}
                            onChange={(e) => updateIngredient(i, { note: e.target.value })}
                            placeholder="Note (optional)"
                        />
                    </div>
                ))}
            </div>

            <button type="button" onClick={addIngredient} className="mt-2 px-3 py-2 bg-main text-bright rounded text-sm">Add ingredient</button>
        </div>
    );
}

function StepsStep() {
    const { form, setForm } = useUploadRecipe();

    function addStep() {
        setForm((p) => ({ ...p, steps: [...p.steps, { id: makeId(), index: p.steps.length + 1, description: "" }] }));
    }
    function updateStep(idx: number, desc: string) {
        setForm((p) => {
            const steps = [...p.steps];
            steps[idx] = { ...steps[idx], description: desc };
            return { ...p, steps };
        });
    }

    function removeStep(idx: number) {
        setForm((p) => ({ ...p, steps: p.steps.filter((_, i) => i !== idx) }));
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3">
                {form.steps.map((s, i) => (
                    <div key={s.id || i} className="flex-col items-start gap-3">
                        <div className="w-16 text-sm font-medium pt-2">Step {i + 1}</div>
                        <div className="flex">
                            <textarea
                                className="flex-1 w-full rounded-lg px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 transition-all duration-200 ease-in-out"
                                value={s.description}
                                onChange={(e) => updateStep(i, e.target.value)}
                                rows={2}
                                placeholder={`Describe step ${i + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeStep(i)}
                                aria-label={`Remove step ${i + 1}`}
                                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button type="button" onClick={addStep} className="mt-2 px-3 py-2 bg-main text-bright rounded text-sm">Add step</button>
        </div>
    );
}

function MediaStep() {
    const { form, setForm } = useUploadRecipe();

    function onFile(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setForm((p) => ({ ...p, imageFile: file }));
    }

    return (
        <div className="space-y-3">
            <label className="block">
                <div className="text-sm font-medium">Cover image</div>
                <input type="file" accept="image/*" onChange={onFile} className="mt-2" />
            </label>

            {form.imageFile && (
                <div className="mt-2">
                    <img src={URL.createObjectURL(form.imageFile)} alt="preview" className="max-h-48 rounded" />
                </div>
            )}
        </div>
    );
}

function ReviewStep() {
    const { form, setForm } = useUploadRecipe();
    const [tagInput, setTagInput] = useState("");
    const [suggestions, setSuggestions] = useState<{ id: number; name: string }[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const debounceRef = useRef<number | null>(null);
    const prep = form.preparation_time != null ? `${form.preparation_time} minutes` : "—";
    const cook = form.cooking_time != null ? `${form.cooking_time} minutes` : "—";
    const difficulty = form.difficulty != null ? `${form.difficulty}` : "—";

    // fetch suggestions from tags table matching input (debounced)
    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        if (!tagInput || tagInput.trim() === "") {
            setSuggestions([]);
            return;
        }
        setLoadingSuggestions(true);
        // debounce 250ms
        debounceRef.current = window.setTimeout(async () => {
            const q = tagInput.trim();

            // try RPC that uses pg_trgm first (faster / more tolerant)
            try {
                const { data, error } = await supabase.rpc("search_tags_trgm", { q });
                if (!error && Array.isArray(data)) {
                    setSuggestions(data as any);
                    setLoadingSuggestions(false);
                    return;
                }
            } catch (e) {
                // ignore and fallback
            }

            // fallback to ilike if RPC unavailable or errored
            try {
                const { data, error } = await supabase
                    .from("tags")
                    .select("id,name")
                    .ilike("name", `%${q}%`)
                    .limit(10);
                if (!error && Array.isArray(data)) setSuggestions(data as any);
                else setSuggestions([]);
            } catch (e) {
                setSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 250);
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [tagInput]);

    function addTag(name?: string) {
        const t = (name ?? tagInput).trim();
        if (!t) return;
        setForm((p) => ({
            ...p,
            tags: Array.from(
                new Set([...(p.tags ?? []).map((x: any) => x.name), t])
            ).map((n) => ({ name: n })),
        }));
        setTagInput("");
        setSuggestions([]);
    }

    function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            // if there's a top suggestion, use it
            if (suggestions.length > 0) addTag(suggestions[0].name);
            else addTag();
        }
        if (e.key === "ArrowDown" && suggestions.length > 0) {
            // focus first suggestion by clicking it programmatically (simple UX)
            const el = document.querySelector<HTMLInputElement>(".tag-suggestion-item");
            if (el) el.focus();
        }
    }

    function removeTag(tagToRemove: string) {
        setForm((p) => ({ ...p, tags: (p.tags ?? []).filter((t: any) => t.name !== tagToRemove) }));
    }

    return (
        <div className="space-y-3 relative">
            <h3 className="font-medium">Preview</h3>
            <div className="text-sm text-gray-700"><strong>Title:</strong> {form.title || "—"}</div>
            <div className="text-sm text-gray-700"><strong>Preparation time:</strong> {prep}</div>
            <div className="text-sm text-gray-700"><strong>Cooking time:</strong> {cook}</div>
            <div className="text-sm text-gray-700"><strong>Servings:</strong> {form.servings ?? "—"}</div>
            <div className="text-sm text-gray-700"><strong>Difficulty:</strong> {difficulty}</div>
            <div className="text-sm text-gray-700"><strong>Ingredients:</strong> {form.ingredients.length} items</div>
            <div className="text-sm text-gray-700"><strong>Steps:</strong> {form.steps.length} steps</div>

            <div className="space-y-2">
                <div className="text-sm font-medium">Tags</div>
                <div className="relative">
                    <div className="flex gap-2 items-center">
                        <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={onTagKeyDown}
                            placeholder="Add tag and press Enter"
                            className="rounded-lg border px-3 py-2 outline-none shadow-sm bg-white/70 focus:ring-1 focus:ring-main transition-all duration-150 w-full"
                        />
                        <button type="button" onClick={() => addTag()} className="px-3 py-2 bg-main text-bright rounded">Add</button>
                    </div>

                    {/* suggestions dropdown */}
                    {tagInput.trim() !== "" && (
                        <div className="absolute z-20 mt-1 w-full bg-bright/95 border rounded shadow-lg max-h-48 overflow-auto">
                            {loadingSuggestions ? (
                                <div className="p-2 text-sm text-gray-500">Loading...</div>
                            ) : suggestions.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500">No suggestions</div>
                            ) : (
                                suggestions.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => addTag(s.name)}
                                        className="tag-suggestion-item w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                    >
                                        {s.name}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                    {(form.tags ?? []).length === 0 ? (
                        <div className="text-sm text-gray-500">No tags</div>
                    ) : (
                        (form.tags ?? []).map((t: { name: string }) => (
                            <span key={t.name} className="inline-flex items-center gap-2 bg-gray-100 text-sm px-2 py-1 rounded">
                                <span>{t.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeTag(t.name)}
                                    aria-label={`Remove tag ${t.name}`}
                                    className="text-red-600 hover:bg-red-50 rounded px-1"
                                >
                                    ✕
                                </button>
                            </span>
                        ))
                    )}
                </div>
            </div>

            <div className="text-sm text-gray-700"><strong>Image:</strong> {form.imageFile ? form.imageFile.name : "None"}</div>

            <p className="text-xs text-gray-500 mt-2">Use Publish to send to the server.</p>
        </div>
    );
}

const STEPS = [
    { id: "details", title: "Details", comp: DetailsStep },
    { id: "ingredients", title: "Ingredients", comp: IngredientsStep },
    { id: "steps", title: "Steps", comp: StepsStep },
    { id: "media", title: "Media", comp: MediaStep },
    { id: "review", title: "Review", comp: ReviewStep },
];

function UploadFormInner() {
    const { form } = useUploadRecipe();
    const [stepIndex, setStepIndex] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const StepComp = useMemo(() => STEPS[stepIndex].comp, [stepIndex]);
    const navigate = useNavigate();

    function validateStep(index: number) {
        const msgs: string[] = [];
        if (index === 0) {
            if (!form.title || form.title.trim() === "") msgs.push("Title is required.");
            if (!form.short_description || form.short_description.trim() === "") msgs.push("Short description is required.");

            // Preparation time validation
            if (form.preparation_time === null || form.preparation_time === undefined || Number.isNaN(Number(form.preparation_time))) {
                msgs.push("Preparation time is required.");
            } else if (typeof form.preparation_time === "number" && form.preparation_time < 0) {
                msgs.push("Preparation time must be a positive number.");
            }

            // Cooking time validation
            if (form.cooking_time === null || form.cooking_time === undefined || Number.isNaN(Number(form.cooking_time))) {
                msgs.push("Cooking time is required.");
            } else if (typeof form.cooking_time === "number" && form.cooking_time < 0) {
                msgs.push("Cooking time must be a positive number.");
            }

            // Difficulty validation
            if (form.difficulty === null || form.difficulty === undefined || form.difficulty === "") {
                msgs.push("Difficulty is required.");
            } else if (typeof form.difficulty === "number" && (form.difficulty < 1 || form.difficulty > 5)) {
                msgs.push("Difficulty must be between 1 and 5.");
            }
        }
        if (index === 1) {
            if (!form.ingredients || form.ingredients.length === 0) msgs.push("Add at least one ingredient.");
            else {
                form.ingredients.forEach((ing, i) => {
                    if (!ing.name || ing.name.trim() === "") msgs.push(`Ingredient ${i + 1}: name is required.`);
                    // amount is numeric | null
                    if (ing.amount === null || ing.amount === undefined || ing.amount <= 0) msgs.push(`Ingredient ${i + 1}: amount is required.`);
                    else if (typeof ing.amount === "number" && Number.isNaN(ing.amount)) msgs.push(`Ingredient ${i + 1}: amount must be a number.`);
                });
            }
        }
        if (index === 2) {
            if (!form.steps || form.steps.length === 0) msgs.push("Add at least one step.");
            else {
                form.steps.forEach((s, i) => {
                    if (!s.description || s.description.trim() === "") msgs.push(`Step ${i + 1}: description is required.`);
                });
            }
        }
        return msgs;
    }

    function next() {
        const msgs = validateStep(stepIndex);
        if (msgs.length > 0) {
            setErrors(msgs);
            return;
        }
        setErrors([]);
        if (stepIndex < STEPS.length - 1) setStepIndex((s) => s + 1);
    }
    function back() {
        if (stepIndex > 0) setStepIndex((s) => s - 1);
    }

    async function submit() {
        // full validation across required steps
        const allMsgs: { index: number; msgs: string[] }[] = [];
        for (let i = 0; i <= 2; i++) {
            const msgs = validateStep(i);
            if (msgs.length > 0) allMsgs.push({ index: i, msgs });
        }
        if (allMsgs.length > 0) {
            setErrors(allMsgs[0].msgs);
            setStepIndex(allMsgs[0].index);
            return;
        }
        setErrors([]);
        try {
            // Get current user from Supabase auth
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                setErrors(["You must be logged in to upload a recipe."]);
                return;
            }
            // 1) Build the payload that matches ONLY the recipes table columns
            const recipePayload = {
                title: form.title,
                authorId: user.id, 
                short_description: form.short_description ,
                image_url: form.imageFile ?? null,
                prep_time: form.preparation_time ,
                cook_time: form.cooking_time ,
                servings: form.servings,
                difficulty: form.difficulty,
            };

            // 2) Insert into recipes and get the new recipe id back
            const { data: inserted, error: recipeError } = await supabase
                .from("recipes")
                .insert([recipePayload])
                .select("id")
                .single();

            if (recipeError) throw recipeError;

            const recipeId = inserted.id;

            // 3) Insert ingredients (if you have a recipe_ingredients table)
            if (form.ingredients.length > 0) {
                const ingredientRows = form.ingredients.map((ing) => ({
                    recipe_id: recipeId,
                    name: ing.name,
                    amount: ing.amount,
                    unit: ing.unit,
                    notes: ing.note ?? null,
                }));

                const { error: ingredientsError } = await supabase
                    .from("recipe-ingredients")
                    .insert(ingredientRows);

                if (ingredientsError) throw ingredientsError;
            }

            // 4) Insert steps
            if (form.steps.length > 0) {
                const stepRows = form.steps.map((step, index) => ({
                    recipe_id: recipeId,
                    index: index+1,
                    text: step.description,
                }));

                const { error: stepsError } = await supabase
                    .from("recipe-steps")
                    .insert(stepRows);

                if (stepsError) throw stepsError;
            }

            // 5) Insert tags and recipe-tags relationships
            if (form.tags && form.tags.length > 0) {
                // Upsert all tags (avoid duplicates) and get their ids back
                const tagNames = form.tags.map((t: { name: string }) => t.name.trim()).filter(Boolean);
                if (tagNames.length > 0) {
                    const upsertRows = tagNames.map((name) => ({ name }));
                    const { data: upsertedTags, error: upsertError } = await supabase
                        .from("tags")
                        .upsert(upsertRows, { onConflict: "name" })
                        .select("id,name");
                    if (upsertError) throw upsertError;

                    // Build map name -> id
                    const tagIdMap = new Map<string, number>();
                    (upsertedTags ?? []).forEach((t: any) => tagIdMap.set(t.name, t.id));

                    // Insert recipe-tag relations (batch)
                    const recipeTagRows = tagNames
                        .map((name) => ({ recipe_id: recipeId, tag_id: tagIdMap.get(name) }))
                        .filter((r) => r.tag_id != null);

                    if (recipeTagRows.length > 0) {
                        const { error: recipeTagsError } = await supabase
                            .from("recipe-tags")
                            .insert(recipeTagRows);
                        if (recipeTagsError) throw recipeTagsError;
                    }
                }
            }
            
            // navigate to the newly created recipe page
            navigate(`/recipes/${recipeId}`);
        } catch (err: any) {
            console.error(err);
            setErrors(["Something went wrong while saving the recipe."]);
        }
    }

    return (
        <div className="rounded-lg bg-bright/90 p-4 shadow-sm flex flex-col min-h-90 max-h-[70vh]">
            <div className="mb-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">{STEPS[stepIndex].title}</h2>
                    <div className="text-sm text-gray-500">Step {stepIndex + 1} / {STEPS.length}</div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-main transition-all duration-300 ease-in-out" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
                </div>
                {errors.length > 0 && (
                    <div className="mt-3 p-3 bg-danger/20  text-danger rounded">
                        <ul className="list-disc pl-5 text-sm">
                            {errors.map((m, i) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scroll py-2 ">
                <StepComp />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={back}
                    disabled={stepIndex === 0}
                    className={`px-4 py-2 rounded bg-transparent border border-gray-300 text-sm ${stepIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-400 hover:text-bright transition-all duration-200"}`}
                >
                    Back
                </button>

                <div className="flex items-center gap-2">
                    {stepIndex < STEPS.length - 1 ? (
                        <button type="button" onClick={next} className="px-4 py-2 rounded bg-secondary hover:-translate-y-1 hover:opacity-80 transition-all duration-200  text-bright text-sm">Next</button>
                    ) : (
                        <button type="button" onClick={submit} className="px-4 py-2 rounded bg-main hover:-translate-y-1 hover:opacity-80 transition-all duration-200  text-bright text-sm">Publish</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UploadRecipePage() {
    return (
        <UploadRecipeProvider>
            <div className="min-h-screen bg-bright/5">
                <main className="max-w-4xl mx-auto px-4 py-8">
                    <h1 className="text-2xl font-heading-styled text-main mb-4">Upload a recipe</h1>
                    <UploadFormInner />
                </main>
            </div>
        </UploadRecipeProvider>
    );
}