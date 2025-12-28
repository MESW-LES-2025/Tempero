import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import ReviewPage from "../../src/pages/ReviewPage";
import { supabase } from "../../src/config/supabaseClient";
import { getLevelInfo } from "../../src/utils/Levels";

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

vi.mock("../../src/utils/Levels", () => ({
  getLevelInfo: vi.fn(),
}));

vi.mock("../../src/config/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

function renderWithRoute(recipeId = "recipe-1") {
  return render(
    <MemoryRouter initialEntries={[`/review/${recipeId}`]}>
      <Routes>
        <Route path="/review/:id" element={<ReviewPage />} />
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

describe("ReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    (getLevelInfo as any).mockReturnValue({
      level: 2,
      name: "Rising Cook",
    });
  });

  it("mostra loader enquanto carrega e depois mostra título da receita", async () => {
    mockFromByTable({
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { title: "Carbonara" },
          error: null,
        }),
      },
      reviews: {
        insert: vi.fn(),
      },
      profiles: {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
        update: vi.fn(),
      },
    });

    renderWithRoute("123");

    expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();

    expect(await screen.findByText(/carbonara/i)).toBeInTheDocument();
    expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
  });

    it("mostra erro se tentar submeter sem avaliar as 3 categorias", async () => {
    const insertMock = vi.fn();

    mockFromByTable({
        recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
            data: { title: "Carbonara" },
            error: null,
        }),
        },
        reviews: { insert: insertMock },
        profiles: {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
        update: vi.fn(),
        },
    });

    renderWithRoute("123");
    await screen.findByText(/carbonara/i);

    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(
        await screen.findByText(/please rate all three categories/i)
    ).toBeInTheDocument();

    expect(insertMock).not.toHaveBeenCalled();
    });

  it("mostra erro se ratings estiverem fora de 1..5 (defensivo)", async () => {
    mockFromByTable({
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { title: "Carbonara" },
          error: null,
        }),
      },
      reviews: { insert: vi.fn() },
      profiles: {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
        update: vi.fn(),
      },
    });

    renderWithRoute("123");
    await screen.findByText(/carbonara/i);

    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(
      await screen.findByText(/please rate all three categories/i)
    ).toBeInTheDocument();
  });

    it("mostra erro se user não estiver autenticado", async () => {
    (supabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: null },
    });

    const insertMock = vi.fn();

    mockFromByTable({
        recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
            data: { title: "Carbonara" },
            error: null,
        }),
        },
        reviews: { insert: insertMock },
        profiles: {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
        update: vi.fn(),
        },
    });

    renderWithRoute("123");
    await screen.findByText(/carbonara/i);

    const clickStar = async (cardTitle: RegExp, starIndex1to5: number) => {
        const cardHeading = screen.getByRole("heading", { name: cardTitle });
        const card = cardHeading.closest("div")!;
        const stars = card.querySelectorAll("button");
        await userEvent.click(stars[starIndex1to5 - 1] as any);
    };

    await clickStar(/difficulty/i, 4);
    await clickStar(/time required/i, 4);
    await clickStar(/quality & taste/i, 4);

    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(
        await screen.findByText(/you must be logged in to submit a review/i)
    ).toBeInTheDocument();

    expect(insertMock).not.toHaveBeenCalled();
    });

    it("submete review com sucesso, atualiza XP e navega com state", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    const recipesHandler = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
        .fn()
        .mockResolvedValueOnce({ data: { title: "Carbonara" }, error: null })
        .mockResolvedValueOnce({ data: { difficulty: 3 }, error: null }),
    };

    const profileSingle = vi.fn().mockResolvedValue({
        data: { xp: 50, level: 1 },
        error: null,
    });

    const eqSpy = vi.fn().mockResolvedValue({ error: null });
    const updateSpy = vi.fn().mockReturnValue({ eq: eqSpy });

    const profilesHandler = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: profileSingle,
        update: updateSpy,
    };

    (getLevelInfo as any).mockReturnValueOnce({ level: 2, name: "Rising Cook" });

    mockFromByTable({
        recipes: recipesHandler,
        reviews: { insert: insertMock },
        profiles: profilesHandler,
    });

    renderWithRoute("123");
    await screen.findByText(/carbonara/i);

    const clickStar = async (cardTitle: RegExp, starIndex1to5: number) => {
        const cardHeading = screen.getByRole("heading", { name: cardTitle });
        const card = cardHeading.closest("div")!;
        const stars = card.querySelectorAll("button");
        await userEvent.click(stars[starIndex1to5 - 1] as any);
    };

    await clickStar(/difficulty/i, 3);
    await clickStar(/time required/i, 4);
    await clickStar(/quality & taste/i, 5);

    await userEvent.type(
        screen.getByPlaceholderText(/write your review here/i),
        "Nice recipe!"
    );

    const submitBtn = screen.getByRole("button", { name: /submit review/i });
    await userEvent.click(submitBtn);


    await waitFor(() => {
        expect(insertMock).toHaveBeenCalledTimes(1);
    });

    const payload = insertMock.mock.calls[0][0];
    expect(payload.recipe_id).toBe("123");
    expect(payload.author_id).toBe("user-1");
    expect(payload.difficulty).toBe(3);
    expect(payload.prep_time).toBe(4);
    expect(payload.taste).toBe(5);
    expect(payload.description).toBe("Nice recipe!");
    expect(typeof payload.average_rating).toBe("number");

    await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith({
        xp: 190,
        level: 2,
        chef_type: "Rising Cook",
        });
    });

    expect(eqSpy).toHaveBeenCalledWith("auth_id", "user-1");

    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/recipe/123", {
        state: {
            xpGained: 140,
            leveledUp: true,
            newLevel: 2,
            newChefType: "Rising Cook",
        },
        });
    });
    });

  it("mostra erro se insert falhar", async () => {
    const insertMock = vi.fn().mockResolvedValue({
      error: { message: "Insert failed!" },
    });

    mockFromByTable({
      recipes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { title: "Carbonara" },
          error: null,
        }),
      },
      reviews: { insert: insertMock },
      profiles: {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
        update: vi.fn(),
      },
    });

    renderWithRoute("123");
    await screen.findByText(/carbonara/i);

    const clickStar = async (cardTitle: RegExp, starIndex1to5: number) => {
      const cardHeading = screen.getByRole("heading", { name: cardTitle });
      const card = cardHeading.closest("div")!;
      const stars = card.querySelectorAll("button");
      await userEvent.click(stars[starIndex1to5 - 1] as any);
    };

    await clickStar(/difficulty/i, 3);
    await clickStar(/time required/i, 3);
    await clickStar(/quality & taste/i, 3);

    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(await screen.findByText(/insert failed!/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
