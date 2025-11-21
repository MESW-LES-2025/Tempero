import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadRecipePage from "../../src/pages/UploadRecipePage";
import { supabase } from "../../src/config/supabaseClient";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

/*Mock react-router-dom (navigate)*/
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/*Mock image helpers*/
vi.mock("../../src/utils/CompressImage", () => ({
  compressImage: vi.fn(async (file: File) => file),
}));

vi.mock("../../src/utils/UploadImage", () => ({
  uploadImage: vi.fn(async () => "recipes/fake-image.jpg"),
}));

/*Mock Supabase*/
vi.mock("../../src/config/supabaseClient", () => {
  const mockAuthGetUser = vi.fn();
  const mockFrom = vi.fn((table: string) => {
    switch (table) {
      case "recipes":
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: "recipe-1" },
                error: null,
              }),
            })),
          })),
        };
      case "recipe-ingredients":
      case "recipe-steps":
      case "recipe-tags":
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      case "tags":
        return {
          upsert: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
          select: vi.fn(() => ({
            ilike: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      default:
        return {
          select: vi.fn(() => ({
            ilike: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
    }
  });

  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });

  return {
    supabase: {
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: mockRpc,
      __mockAuthGetUser: mockAuthGetUser,
      __mockFrom: mockFrom,
    },
  };
});

const mockedAuthGetUser = (supabase as any).__mockAuthGetUser;

/* ---------- Helper render ---------- */
const renderPage = () =>
  render(
    <MemoryRouter>
      <UploadRecipePage />
    </MemoryRouter>
  );

describe("UploadRecipePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initial UI with title and first step", () => {
    renderPage();

    // Page title
    expect(
      screen.getByText(/upload a recipe/i)
    ).toBeInTheDocument();

    // First step title
    expect(screen.getByText(/details/i)).toBeInTheDocument();

    // Step indicator
    expect(screen.getByText(/step 1 \/ 5/i)).toBeInTheDocument();

    // "Next" button present
    expect(
      screen.getByRole("button", { name: /next/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors when trying to go next with empty details", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // We expect the first-step validations to fire
    expect(
      screen.getByText(/title is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/short description is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/preparation time is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/cooking time is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/difficulty is required/i)
    ).toBeInTheDocument();
  });

  it("goes to ingredients step after filling valid details", async () => {
    renderPage();

    // Fill Details step
    fireEvent.change(
      screen.getByPlaceholderText(/recipe title/i),
      { target: { value: "My Test Recipe" } }
    );

    fireEvent.change(
      screen.getByLabelText(/short description/i),
      { target: { value: "Tasty dish" } }
    );

    fireEvent.change(
      screen.getByLabelText(/preparation time/i),
      { target: { value: "10" } }
    );

    fireEvent.change(
      screen.getByLabelText(/cooking time/i),
      { target: { value: "20" } }
    );

    fireEvent.change(
      screen.getByLabelText(/servings/i),
      { target: { value: "2" } }
    );

    fireEvent.change(
      screen.getByLabelText(/difficulty/i),
      { target: { value: "1" } } // 1 — Very easy
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/ingredients/i)
      ).toBeInTheDocument();
    });
  });

  it("submits successfully and navigates to new recipe page", async () => {
    // User is logged in
    mockedAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    renderPage();

    //Step 1: Details
    fireEvent.change(
      screen.getByPlaceholderText(/recipe title/i),
      { target: { value: "My Test Recipe" } }
    );

    fireEvent.change(
      screen.getByLabelText(/short description/i),
      { target: { value: "Tasty dish" } }
    );

    fireEvent.change(
      screen.getByLabelText(/preparation time/i),
      { target: { value: "10" } }
    );

    fireEvent.change(
      screen.getByLabelText(/cooking time/i),
      { target: { value: "20" } }
    );

    fireEvent.change(
      screen.getByLabelText(/servings/i),
      { target: { value: "2" } }
    );

    fireEvent.change(
      screen.getByLabelText(/difficulty/i),
      { target: { value: "1" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    //Step 2: Ingredients
    await screen.findByText(/ingredients/i);

    fireEvent.click(
      screen.getByRole("button", { name: /add ingredient/i })
    );

    // Fill first ingredient
    fireEvent.change(
      screen.getByPlaceholderText(/ingredient/i),
      { target: { value: "Flour" } }
    );

    fireEvent.change(
      screen.getByPlaceholderText(/amt/i),
      { target: { value: "200" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    //Step 3: Steps
    await screen.findByText(/steps/i);

    fireEvent.click(
      screen.getByRole("button", { name: /add step/i })
    );

    fireEvent.change(
      screen.getByPlaceholderText(/describe step 1/i),
      { target: { value: "Mix everything." } }
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    //Step 4: Media
    await screen.findByText(/media/i);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    //Step 5: Review
    await screen.findByText(/^review$/i);

    fireEvent.click(
      screen.getByRole("button", { name: /publish/i })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/recipe/recipe-1");
    });
  });

  it("shows error if user is not logged in when publishing", async () => {
    // auth.getUser returns no user
    mockedAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    renderPage();

    // Fill Details minimally valid
    fireEvent.change(
      screen.getByPlaceholderText(/recipe title/i),
      { target: { value: "My Test Recipe" } }
    );
    fireEvent.change(
      screen.getByLabelText(/short description/i),
      { target: { value: "Tasty dish" } }
    );
    fireEvent.change(
      screen.getByLabelText(/preparation time/i),
      { target: { value: "10" } }
    );
    fireEvent.change(
      screen.getByLabelText(/cooking time/i),
      { target: { value: "20" } }
    );
    fireEvent.change(
      screen.getByLabelText(/servings/i),
      { target: { value: "2" } }
    );
    fireEvent.change(
      screen.getByLabelText(/difficulty/i),
      { target: { value: "1" } }
    );

    // Next -> Ingredients
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/ingredients/i);

    fireEvent.click(
      screen.getByRole("button", { name: /add ingredient/i })
    );
    fireEvent.change(
      screen.getByPlaceholderText(/ingredient/i),
      { target: { value: "Flour" } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(/amt/i),
      { target: { value: "200" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Steps
    await screen.findByText(/steps/i);
    fireEvent.click(
      screen.getByRole("button", { name: /add step/i })
    );
    fireEvent.change(
      screen.getByPlaceholderText(/describe step 1/i),
      { target: { value: "Mix everything." } }
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Media
    await screen.findByText(/media/i);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Review
    await screen.findByRole("heading", { name: "Review", level: 2 });

    fireEvent.click(
      screen.getByRole("button", { name: /publish/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/you must be logged in to upload a recipe/i)
      ).toBeInTheDocument();
    });
  });
});
