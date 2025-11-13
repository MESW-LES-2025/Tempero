import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { UploadRecipeProvider, useUploadRecipe } from "../utils/UploadRecipeContext";

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
        </div>
    );
}

function IngredientsStep() {
    const { form, setForm } = useUploadRecipe();

    function addIngredient() {
        setForm((p) => ({ ...p, ingredients: [...p.ingredients, { id: makeId(), name: "", amount: "", unit: "", note: "" }] }));
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
                                className="w-20 rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                                value={ing.amount}
                                onChange={(e) => updateIngredient(i, { amount: e.target.value })}
                                placeholder="Amt"
                            />
                            <input
                                className="w-20 rounded-lg border px-3 py-2 outline-none shadow-lg bg-white/70 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                                value={ing.unit}
                                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                                placeholder="Unit"
                            />
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
    const { form } = useUploadRecipe();
    return (
        <div className="space-y-3">
            <h3 className="font-medium">Preview</h3>
            <div className="text-sm text-gray-700"><strong>Title:</strong> {form.title || "—"}</div>
            <div className="text-sm text-gray-700"><strong>Ingredients:</strong> {form.ingredients.length} items</div>
            <div className="text-sm text-gray-700"><strong>Steps:</strong> {form.steps.length} steps</div>
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

    function validateStep(index: number) {
        const msgs: string[] = [];
        if (index === 0) {
            if (!form.title || form.title.trim() === "") msgs.push("Title is required.");
            if(!form.short_description || form.short_description.trim() === "") msgs.push("Short description is required.");
        }
        if (index === 1) {
            if (!form.ingredients || form.ingredients.length === 0) msgs.push("Add at least one ingredient.");
            else {
                form.ingredients.forEach((ing, i) => {
                    if (!ing.name || ing.name.trim() === "") msgs.push(`Ingredient ${i + 1}: name is required.`);
                    if (!ing.amount || ing.amount.trim() === "") msgs.push(`Ingredient ${i + 1}: amount is required.`);
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
        // placeholder: implement upload
        console.log("submit recipe", form);
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