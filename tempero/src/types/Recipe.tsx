import { NavLink } from "react-router-dom";

export type RecipePreview = {
    id: string;
    title: string;
    author_id: string;
    short_description: string;
    image_url: string;
    preparation_time: number;
    cooking_time: number;
    servings: number;
    difficulty: number;
};

export type Recipe = RecipePreview & {
    ingredients: Ingredient[];
    steps: Step[];
};

export type Ingredient = {
    id: string;
    name: string;
    amount: string;
    unit?: string;
    note?: string;
};

export type Step = {
    id: string;
    index: number;
    description: string;
};

export default function UploadRecipeButton() {
    return (
        <button className="bg-main text-bright text-3xl font-heading fixed right-6 bottom-10 py-2 px-4 rounded shadow-2xl hover:cursor-pointer hover:-translate-y-1 hover:opacity-80 transition-all">
            <NavLink to="/upload-recipe">+</NavLink>
        </button>
    )
}
