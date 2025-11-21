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

// Mock Supabase client
vi.mock("../../src/config/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Helper to mock Supabase select chain
function mockSupabaseSelect(data: any) {
  return {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    data,
    error: null,
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
    expect(screen.getByPlaceholderText(/find a recipe/i)).toBeInTheDocument();
  });

  it("switches to USERS tab when clicked", () => {
    render(<SearchPage />);
    fireEvent.click(screen.getByText("USERS"));
    expect(
      screen.getByPlaceholderText(/find a user by name/i)
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
      expect(screen.getByText(/joao/i)).toBeInTheDocument();
    });

    // Apply Level 3 filter
    fireEvent.click(screen.getByLabelText(/Level 3/i));

    await waitFor(() => {
      expect(screen.queryByText(/joao/i)).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Maria Rocha" })).toBeInTheDocument();
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

    fireEvent.click(screen.getByLabelText(/Difficulty 1/i));

    await waitFor(() => {
      expect(screen.getByText(/easy soup/i)).toBeInTheDocument();
      expect(screen.queryByText(/hard steak/i)).not.toBeInTheDocument();
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
});
