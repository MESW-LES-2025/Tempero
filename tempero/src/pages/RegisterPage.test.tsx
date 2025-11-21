import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import RegisterPage from "./RegisterPage";
import { supabase } from "../config/supabaseClient";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// mock global do supabase
vi.mock("../config/supabaseClient", () => {
  const rpc = vi.fn().mockResolvedValue({ data: true, error: null });

  return {
    supabase: {
      auth: {
        signUp: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
      rpc,
    },
  };
});

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it("renderiza campos básicos de registo", () => {
    renderWithRouter();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("não permite submit se username não estiver disponível (ou não validado)", async () => {
    // Forçar que o RPC devolve false -> username indisponível
    (supabase.rpc as any).mockResolvedValueOnce({ data: false, error: null });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "new@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/username/i),
      "joao"
    );
    await userEvent.type(
      screen.getByLabelText(/first name/i),
      "Joao"
    );
    await userEvent.type(
      screen.getByLabelText(/last name/i),
      "Silva"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "password123"
    );

    // Esperar pelo resultado da verificação de username
    await waitFor(() => {
      expect(
        screen.getByText(/username is already taken/i)
      ).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", { name: /register/i });
    expect(registerBtn).toBeDisabled();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("faz signUp e redireciona para /login quando dados são válidos", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });
    (supabase.auth.signUp as any).mockResolvedValue({
      data: {},
      error: null,
    });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "new@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/username/i),
      "joao"
    );
    await userEvent.type(
      screen.getByLabelText(/first name/i),
      "Joao"
    );
    await userEvent.type(
      screen.getByLabelText(/last name/i),
      "Silva"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "password123"
    );

    // Esperar até o debounce + rpc marcarem o username como disponível
    await waitFor(() => {
      expect(
        screen.getByText(/username is available/i)
      ).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", { name: /register/i });
    expect(registerBtn).toBeEnabled();

    await userEvent.click(registerBtn);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("valida password com menos de 8 caracteres", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "new@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/username/i),
      "joao"
    );
    await userEvent.type(
      screen.getByLabelText(/first name/i),
      "Joao"
    );
    await userEvent.type(
      screen.getByLabelText(/last name/i),
      "Silva"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "1234567"
    );

    // garantir que username ficou disponível
    await waitFor(() => {
      expect(
        screen.getByText(/username is available/i)
      ).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", { name: /register/i });
    expect(registerBtn).toBeEnabled();

    await userEvent.click(registerBtn);

    expect(
      await screen.findByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });
});
