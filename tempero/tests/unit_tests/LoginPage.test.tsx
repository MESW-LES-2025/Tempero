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

  it("normaliza erro de email não confirmado e mostra botão de resend", async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: { message: "Email not confirmed" },
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

    // Mensagem normalizada
    expect(
      await screen.findByText(/email not confirmed\. check your inbox or resend the confirmation\./i)
    ).toBeInTheDocument();

    // Botão de resend fica visível porque err contém "confirm"
    expect(
      screen.getByRole("button", { name: /resend confirmation email/i })
    ).toBeInTheDocument();
  });

  it("pede email antes de reenviar confirmação se o campo estiver vazio", async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: { message: "Email not confirmed" },
    });

    renderWithRouter();

    // Fazer login falhar para ativar o botão de resend
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

    // Botão de resend visível
    const emailInput = await screen.findByLabelText(/email/i);
    const resendBtn = screen.getByRole("button", {
      name: /resend confirmation email/i,
    });

    // Limpar email para cair no ramo `if (!email)`
    await userEvent.clear(emailInput);

    await userEvent.click(resendBtn);

    expect(
      await screen.findByText(/enter your email first to resend the confirmation link/i)
    ).toBeInTheDocument();

    expect(supabase.auth.resend).not.toHaveBeenCalled();
  });

  it("envia email de confirmação com sucesso ao clicar em Resend confirmation email", async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: { message: "Email not confirmed" },
    });

    (supabase.auth.resend as any).mockResolvedValue({
      data: {},
      error: null,
    });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "confirm@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "password123"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /log in/i })
    );

    const resendBtn = await screen.findByRole("button", {
      name: /resend confirmation email/i,
    });

    await userEvent.click(resendBtn);

    await waitFor(() => {
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "confirm@example.com",
        options: {
          emailRedirectTo: expect.stringMatching(/\/login$/),
        },
      });
    });

    expect(
      await screen.findByText(/confirmation email sent\. please check your inbox/i)
    ).toBeInTheDocument();
  });


  it("mostra erro se resend confirmation falhar", async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: { message: "Email not confirmed" },
    });

    (supabase.auth.resend as any).mockResolvedValue({
      data: {},
      error: { message: "Resend failed!" },
    });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "confirm@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "password123"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /log in/i })
    );

    const resendBtn = await screen.findByRole("button", {
      name: /resend confirmation email/i,
    });

    await userEvent.click(resendBtn);

    expect(
      await screen.findByText(/resend failed!/i)
    ).toBeInTheDocument();
  });

  it("pede email antes de enviar reset password", async () => {
    (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
      data: {},
      error: null,
    });

    renderWithRouter();

    // Não preencher email
    await userEvent.click(
      screen.getByRole("button", { name: /forgot password/i })
    );

    expect(
      await screen.findByText(/enter your email first to receive a reset link/i)
    ).toBeInTheDocument();

    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("mostra erro se reset password falhar", async () => {
    (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
      data: {},
      error: { message: "Reset failed!" },
    });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "reset@example.com"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /forgot password/i })
    );

    expect(
      await screen.findByText(/reset failed!/i)
    ).toBeInTheDocument();
  });

  it("mostra mensagem original quando erro não é de credenciais ou confirmação", async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: { message: "Some other error" },
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

    expect(
      await screen.findByText(/some other error/i)
    ).toBeInTheDocument();
  });

  it("permite alternar entre mostrar e esconder password", async () => {
    renderWithRouter();

    const passInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;

    // estado inicial: password escondida
    expect(passInput.type).toBe("password");
    const showBtn = screen.getByRole("button", { name: /show password/i });

    await userEvent.click(showBtn);
    expect(passInput.type).toBe("text");
    expect(
      screen.getByRole("button", { name: /hide password/i })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /hide password/i })
    );
    expect(passInput.type).toBe("password");
  });


}); 
