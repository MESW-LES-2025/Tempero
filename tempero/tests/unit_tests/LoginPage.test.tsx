import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import LoginPage from "../../src/pages/LoginPage";
import { supabase } from "../../src/config/supabaseClient";

// mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// mock supabase client
vi.mock("../../src/config/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      resend: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(),
  },
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it("renderiza inputs de email e password e botão de login", () => {
    renderWithRouter();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)
).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log in/i })
    ).toBeInTheDocument();
  });

  it("mostra erro quando credenciais são inválidas", async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "test@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "wrongpass"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /log in/i })
    );

    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
  });

  it("navega para skill-assessment quando user não tem xp", async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { xp: null },
        error: null,
      }),
    });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "test@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "password123"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /log in/i })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/skill-assessment");
    });
  });

  it("navega para home quando user já tem xp", async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { xp: 100 },
        error: null,
      }),
    });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "test@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "password123"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /log in/i })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("envia email de reset de password quando clica em Forgot password", async () => {
    (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
      data: {},
      error: null,
    });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "reset@example.com"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /forgot password/i })
    );

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "reset@example.com",
        expect.any(Object)
      );
    });

    expect(
      await screen.findByText(/password reset email sent/i)
    ).toBeInTheDocument();
  });
});
