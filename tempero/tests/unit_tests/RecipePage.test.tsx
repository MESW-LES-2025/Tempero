import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import RecipePage from "../../src/pages/RecipePage";
import { supabase } from "../../src/config/supabaseClient";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../src/components/Loader", () => ({
  default: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock("../../src/utils/ImageURL", () => ({
  recipeImageUrl: () => null,
}));

vi.mock("../../src/utils/ImageUtils", () => ({
  deleteImage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/components/ReportModal", () => ({
  default: ({ isOpen, itemType, itemId }: any) =>
    isOpen ? (
      <div data-testid="report-modal">
        ReportModal open {itemType}:{itemId}
      </div>
    ) : null,
}));

vi.mock("../../src/config/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}));

function renderWithRoute(recipeId = "123", state?: any) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/recipe/${recipeId}`, state }]}>
      <Routes>
        <Route path="/recipe/:id" element={<RecipePage />} />
      </Routes>
    </MemoryRouter>
  );
}

function mockFromByTable(handlers: Record<string, any>) {
  (supabase.from as any).mockImplementation((table: string) => {
    const h = handlers[table];
    if (!h) throw new Error(`No mock handler for table: ${table}`);
    return h;
  });
}

function baseRecipeRow(overrides: Partial<any> = {}) {
  return {
    id: "123",
    title: "Carbonara",
    short_description: "Yummy",
    image_url: null,
    authorId: "user-2",
    prep_time: 10,
    cook_time: 15,
    servings: 2,
    difficulty: 3,
    created_at: "2025-12-28T10:00:00.000Z",
    updated_at: "2025-12-28T10:00:00.000Z",
    profiles: { auth_id: "user-2", username: "chef", first_name: "Chef", last_name: "One" },
    recipe_ingredients: [{ id: 1, name: "Egg", amount: 2, unit: null, notes: null }],
    recipe_steps: [{ index: 1, text: "Boil water" }],
    recipe_tags: [{ tag_id: "t1", tags: { name: "Italian" } }],
    ...overrides,
  };
}

describe("RecipePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it("mostra loader e depois mostra o título da receita", async () => {
    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseRecipeRow(), error: null }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123");

    expect(screen.getByText(/whisking the recipe/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /carbonara/i })).toBeInTheDocument();
  });

  it("mostra 'Recipe not found' quando a query da receita falha", async () => {
    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("404");

    expect(await screen.findByText(/recipe not found/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
  });

  it("mostra botão 'Review Recipe' quando logado, não é autor, e não é admin", async () => {
    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: baseRecipeRow({ authorId: "user-2" }),
          error: null,
        }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123");
    await screen.findByRole("heading", { name: /carbonara/i });

    expect(screen.getByRole("button", { name: /review recipe/i })).toBeInTheDocument();
  });

  it("não mostra botão 'Review Recipe' quando o user é admin", async () => {
    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseRecipeRow(), error: null }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123");
    await screen.findByRole("heading", { name: /carbonara/i });

    expect(screen.queryByRole("button", { name: /review recipe/i })).not.toBeInTheDocument();
  });

  it("mostra botões Edit/Delete quando o user é o autor", async () => {
    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: baseRecipeRow({ authorId: "user-1" }),
          error: null,
        }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123");
    await screen.findByRole("heading", { name: /carbonara/i });

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /report recipe/i })).not.toBeInTheDocument();
  });

  it("mostra toast de XP quando vem state.xpGained e não houve level up", async () => {
    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseRecipeRow(), error: null }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123", { xpGained: 140, leveledUp: false });
    await screen.findByRole("heading", { name: /carbonara/i });

    expect(screen.getByText(/you earned 140 xp/i)).toBeInTheDocument();
  });

  it("mostra modal de level up quando state.leveledUp = true", async () => {
    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseRecipeRow(), error: null }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123", {
      xpGained: 140,
      leveledUp: true,
      newLevel: 2,
      newChefType: "Rising Cook",
    });

    await screen.findByRole("heading", { name: /carbonara/i });

    expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
    expect(screen.getByText(/you've reached level 2/i)).toBeInTheDocument();
    expect(screen.getByText(/rising cook/i)).toBeInTheDocument();
    expect(screen.getByText(/\+140 xp/i)).toBeInTheDocument();
  });

  it("calcula e mostra averages quando há reviews", async () => {
    const profilesHandler = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockFromByTable({
      profiles: profilesHandler,
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseRecipeRow(), error: null }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: "r1",
              difficulty: 4,
              prep_time: 2,
              taste: 5,
              average_rating: 3.7,
              description: "Nice",
              profiles: { first_name: "A", last_name: "B", chef_type: "Cook" },
            },
            {
              id: "r2",
              difficulty: 2,
              prep_time: 4,
              taste: 3,
              average_rating: 3.0,
              description: null,
              profiles: { first_name: "C", last_name: "D", chef_type: "Chef" },
            },
          ],
          error: null,
        }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123");
    await screen.findByRole("heading", { name: /carbonara/i });

    expect(screen.getAllByText("3.0").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("/5").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("4.0")).toBeInTheDocument();
    expect(screen.getByText("3.3")).toBeInTheDocument();
  });

  it("toggle like: logged in faz insert e atualiza UI para 'Liked' e contador", async () => {
    const insertResolved = vi.fn().mockResolvedValue({ error: null });

    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseRecipeRow(), error: null }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: insertResolved,
        delete: vi.fn().mockReturnThis(),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123");
    await screen.findByRole("heading", { name: /carbonara/i });

    const likeBtn = screen.getByRole("button", { name: /like/i });
    await userEvent.click(likeBtn);

    await waitFor(() => {
      expect(insertResolved).toHaveBeenCalledWith({ recipe_id: "123", auth_id: "user-1" });
    });

    expect(await screen.findByText(/liked/i)).toBeInTheDocument();
    expect(screen.getByText(/1 like/i)).toBeInTheDocument();
  });

  it("abre o modal de report ao clicar em 'Report Recipe' (quando não é autor e está logado)", async () => {
    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: baseRecipeRow({ authorId: "user-2" }),
          error: null,
        }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123");
    await screen.findByRole("heading", { name: /carbonara/i });

    await userEvent.click(screen.getByRole("button", { name: /report recipe/i }));

    expect(await screen.findByTestId("report-modal")).toBeInTheDocument();
    expect(screen.getByText(/recipe:123/i)).toBeInTheDocument();
  });

  it("navega para /review/:id ao clicar em 'Review Recipe'", async () => {
    mockFromByTable({
      profiles: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      },
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: baseRecipeRow({ authorId: "user-2" }),
          error: null,
        }),
      },
      recipe_likes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      reviews: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
      comments: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      },
    });

    renderWithRoute("123");
    await screen.findByRole("heading", { name: /carbonara/i });

    await userEvent.click(screen.getByRole("button", { name: /review recipe/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/review/123");
  });
});
