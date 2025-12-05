// tests/unit_tests/SearchPage.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchPage from "../../src/pages/SearchPage";
import { supabase } from "../../src/config/supabaseClient";

// Mock react-router-dom Link
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  };
});

// ---------- Supabase mock ----------
vi.mock("../../src/config/supabaseClient", () => {
  const from = vi.fn();
  const authGetUser = vi
    .fn()
    .mockResolvedValue({ data: { user: null }, error: null });

  return {
    supabase: {
      from,
      auth: {
        getUser: authGetUser,
      },
    },
  };
});

// Helper para mockar o "select chain" do Supabase
function mockSupabaseSelect(data: any, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    data,
    error,
  };
}

describe("SearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tabs and search input", () => {
    render(<SearchPage />);
    expect(
      screen.getByRole("button", { name: "RECIPES" })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/find a recipe by name/i)
    ).toBeInTheDocument();
  });

  it("switches to USERS tab when clicked", () => {
    render(<SearchPage />);
    fireEvent.click(screen.getByText("USERS"));
    expect(
      screen.getByPlaceholderText(/find a user by name or username/i)
    ).toBeInTheDocument();
  });

  it("loads recipes when on recipes tab", async () => {
    (supabase.from as any).mockReturnValue(
      mockSupabaseSelect([
        {
          id: 1,
          title: "Pasta",
          short_description: "Tasty",
          cook_time: 20,
        },
      ])
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("Pasta")).toBeInTheDocument();
    });
  });

  it("loads users when on users tab", async () => {
    (supabase.from as any).mockReturnValue(
      mockSupabaseSelect([
        {
          auth_id: "u1",
          username: "maria",
          first_name: "Maria",
          last_name: "Rocha",
          avatar_url: null,
          level: 3,
        },
      ])
    );

    render(<SearchPage />);

    fireEvent.click(screen.getByText("USERS"));

    await waitFor(() => {
      expect(screen.getByText("Maria Rocha")).toBeInTheDocument();
    });
  });

  it("filters users by level when checkbox is selected", async () => {
    (supabase.from as any).mockReturnValue(
      mockSupabaseSelect([
        {
          auth_id: "u1",
          username: "maria",
          first_name: "Maria",
          last_name: "Rocha",
          avatar_url: null,
          level: 3,
        },
        {
          auth_id: "u2",
          username: "joao",
          first_name: "João",
          last_name: "Silva",
          avatar_url: null,
          level: 1,
        },
      ])
    );

    render(<SearchPage />);

    fireEvent.click(screen.getByText("USERS"));

    await waitFor(() => {
      expect(screen.getByText("@maria")).toBeInTheDocument();
      expect(screen.getByText(/joão silva/i)).toBeInTheDocument();
    });

    // Apply Level 3 filter
    fireEvent.click(screen.getByLabelText(/level 3/i));

    await waitFor(() => {
      expect(screen.getByText("Maria Rocha")).toBeInTheDocument();
      expect(screen.queryByText(/joão silva/i)).not.toBeInTheDocument();
    });
  });

  it("filters recipes by difficulty", async () => {
    (supabase.from as any).mockReturnValue(
      mockSupabaseSelect([
        { id: 1, title: "Easy Soup", difficulty: 1 },
        { id: 2, title: "Hard Steak", difficulty: 5 },
      ])
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText(/easy soup/i)).toBeInTheDocument();
      expect(screen.getByText(/hard steak/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/difficulty 1/i));

    await waitFor(() => {
      expect(screen.getByText(/easy soup/i)).toBeInTheDocument();
      expect(screen.queryByText(/hard steak/i)).not.toBeInTheDocument();
    });
  });

  // ---------- NOVO: filtros de cook time ----------
  it("filters recipes by cooking time filters", async () => {
    (supabase.from as any).mockReturnValue(
      mockSupabaseSelect([
        { id: 1, title: "Quick Omelette", cook_time: 10 },
        { id: 2, title: "Roast Chicken", cook_time: 60 },
        { id: 3, title: "Slow Stew", cook_time: 180 },
      ])
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText(/quick omelette/i)).toBeInTheDocument();
      expect(screen.getByText(/roast chicken/i)).toBeInTheDocument();
      expect(screen.getByText(/slow stew/i)).toBeInTheDocument();
    });

    // Short < 30
    fireEvent.click(screen.getByLabelText(/cook time <30 min/i));

    await waitFor(() => {
      expect(screen.getByText(/quick omelette/i)).toBeInTheDocument();
      expect(screen.queryByText(/roast chicken/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/slow stew/i)).not.toBeInTheDocument();
    });

    // Medium 30–120
    fireEvent.click(screen.getByLabelText(/cook time <30 min/i));
    fireEvent.click(screen.getByLabelText(/cook time 30–120 min/i));

    await waitFor(() => {
      expect(screen.getByText(/roast chicken/i)).toBeInTheDocument();
      expect(screen.queryByText(/quick omelette/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/slow stew/i)).not.toBeInTheDocument();
    });

    // Long > 120
    fireEvent.click(screen.getByLabelText(/cook time 30–120 min/i));
    fireEvent.click(screen.getByLabelText(/cook time >120 min/i));

    await waitFor(() => {
      expect(screen.getByText(/slow stew/i)).toBeInTheDocument();
      expect(screen.queryByText(/quick omelette/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/roast chicken/i)).not.toBeInTheDocument();
    });
  });

  it("filters results based on search query", async () => {
    (supabase.from as any).mockReturnValue(
      mockSupabaseSelect([{ id: 1, title: "Chocolate Cake" }])
    );

    render(<SearchPage />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "cake" },
    });

    await waitFor(() => {
      expect(screen.getByText(/chocolate cake/i)).toBeInTheDocument();
    });
  });

  // ---------- NOVO: ramo de erro ----------
  it("shows error message when Supabase request fails", async () => {
    (supabase.from as any).mockReturnValue(
      mockSupabaseSelect(null, { message: "Fetch failed" })
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to fetch results\./i)
      ).toBeInTheDocument();
    });
  });

  // ---------- NOVO: LISTS tab - mostra apenas listas não privadas ----------
  it("loads lists on LISTS tab and hides private lists", async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "lists") {
        return mockSupabaseSelect([
          {
            id: 1,
            user_id: "u1",
            title: "Public List",
            description: "Nice list",
            visibility: "public",
            created_at: "2025-01-01",
            profiles: { username: "maria" },
          },
          {
            id: 2,
            user_id: "u2",
            title: "Private List",
            description: "Secret",
            visibility: "private",
            created_at: "2025-01-02",
            profiles: { username: "joao" },
          },
        ]);
      }
      if (table === "followers") {
        return mockSupabaseSelect([]);
      }
      // recipes / profiles chamadas em outros testes
      return mockSupabaseSelect([]);
    });

    render(<SearchPage />);

    fireEvent.click(screen.getByText("LISTS"));

    await waitFor(() => {
      expect(screen.getByText(/public list/i)).toBeInTheDocument();
    });

    // private é filtrada no filteredLists
    expect(screen.queryByText(/private list/i)).not.toBeInTheDocument();
  });

  // ---------- NOVO: LISTS tab - filtros de visibilidade (followed / not-followed) ----------
  it("filters lists by visibility filters (followed / not-followed)", async () => {
    // user logado
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "me" } },
      error: null,
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "lists") {
        return mockSupabaseSelect([
          {
            id: 1,
            user_id: "followed-user",
            title: "Followed List",
            description: null,
            visibility: "public",
            created_at: null,
            profiles: { username: "maria" },
          },
          {
            id: 2,
            user_id: "other-user",
            title: "Other List",
            description: null,
            visibility: "public",
            created_at: null,
            profiles: { username: "joao" },
          },
        ]);
      }
      if (table === "followers") {
        return mockSupabaseSelect([
          { followed_id: "followed-user" }, // só este é "followed"
        ]);
      }
      return mockSupabaseSelect([]);
    });

    render(<SearchPage />);

    fireEvent.click(screen.getByText("LISTS"));

    await waitFor(() => {
      expect(screen.getByText(/followed list/i)).toBeInTheDocument();
      expect(screen.getByText(/other list/i)).toBeInTheDocument();
    });

    // aplica filtro "Followed"
    fireEvent.click(screen.getByLabelText(/^followed$/i));

    await waitFor(() => {
      expect(screen.getByText(/followed list/i)).toBeInTheDocument();
      expect(screen.queryByText(/other list/i)).not.toBeInTheDocument();
    });

    // adiciona "Not followed" -> aparecem ambas
    fireEvent.click(screen.getByLabelText(/^not followed$/i));

    await waitFor(() => {
      expect(screen.getByText(/followed list/i)).toBeInTheDocument();
      expect(screen.getByText(/other list/i)).toBeInTheDocument();
    });

    // tira o "followed" -> só not-followed
    fireEvent.click(screen.getByLabelText(/^followed$/i));

    await waitFor(() => {
      expect(screen.queryByText(/followed list/i)).not.toBeInTheDocument();
      expect(screen.getByText(/other list/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByText(/followed list/i)).not.toBeInTheDocument();
      expect(screen.getByText(/other list/i)).toBeInTheDocument();
    });
  });

  // ---------- NOVO: empty states para USERS e LISTS ----------
  it("shows empty state when no users found", async () => {
    (supabase.from as any).mockReturnValue(mockSupabaseSelect([]));

    render(<SearchPage />);

    fireEvent.click(screen.getByText("USERS"));

    await waitFor(() => {
      expect(
        screen.getByText(/no users found\. try a different search\./i)
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no lists found", async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "lists") return mockSupabaseSelect([]);
      if (table === "followers") return mockSupabaseSelect([]);
      return mockSupabaseSelect([]);
    });

    render(<SearchPage />);

    fireEvent.click(screen.getByText("LISTS"));

    await waitFor(() => {
      expect(
        screen.getByText(
          /no lists found\. try adjusting your search or filters\./i
        )
      ).toBeInTheDocument();
    });
  });
});
