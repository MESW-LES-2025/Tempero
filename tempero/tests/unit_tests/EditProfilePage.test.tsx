import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import EditProfilePage from "../../src/pages/EditProfilePage";
import { supabase } from "../../src/config/supabaseClient";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

//Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});


//Mock Loader
vi.mock("../../src/components/Loader", () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="loader">{message}</div>
  ),
}));

//Mock Supabase
vi.mock("../../src/config/supabaseClient", () => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();

  return {
    supabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: mockSelect,
          }),
        }),
        update: (data: any) => ({
          eq: () => mockUpdate(data),
        }),
      }),
      __mockSelect: mockSelect,
      __mockUpdate: mockUpdate,
    },
  };
});

const mockedSelect = (supabase as any).__mockSelect;
const mockedUpdate = (supabase as any).__mockUpdate;

// Helper render
const renderPage = () =>
  render(
    <MemoryRouter>
      <EditProfilePage />
    </MemoryRouter>
  );

describe("EditProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loader first", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: "123" } } });
    mockedSelect.mockResolvedValue({
      data: { auth_id: "123", first_name: "Ana", last_name: "Silva", bio: "Chef" },
      error: null,
    });

    renderPage();

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("loads and displays profile data", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: "123" } } });

    mockedSelect.mockResolvedValue({
      data: {
        auth_id: "123",
        username: "ana",
        first_name: "Ana",
        last_name: "Silva",
        bio: "Loves cooking",
      },
      error: null,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText("First name")).toHaveValue("Ana");
      expect(screen.getByLabelText("Last name")).toHaveValue("Silva");
      expect(screen.getByLabelText("Bio")).toHaveValue("Loves cooking");
    });
  });

  it("saves changes and navigates after update", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "123" } },
    });

    mockedSelect.mockResolvedValue({
      data: {
        auth_id: "123",
        username: "ana",
        first_name: "Ana",
        last_name: "Silva",
        bio: "Hello",
      },
      error: null,
    });

    mockedUpdate.mockResolvedValue({ error: null });

    renderPage();

    // Wait for inputs to appear
    await screen.findByLabelText("First name");

    fireEvent.change(screen.getByLabelText("First name"), {
      target: { value: "Ana Maria" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/profile/ana");
    });
  });

  it("shows backend update error", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "123" } },
    });

    mockedSelect.mockResolvedValue({
      data: {
        auth_id: "123",
        username: "ana",
        first_name: "Ana",
        last_name: "Silva",
        bio: "Hello",
      },
      error: null,
    });

    mockedUpdate.mockResolvedValue({
      error: { message: "Update failed!" },
    });

    renderPage();

    await screen.findByLabelText("First name");

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
    });
  });
});
