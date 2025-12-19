import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import RegisterPage from "../../src/pages/RegisterPage";
import { supabase } from "../../src/config/supabaseClient";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// mock global do supabase
vi.mock("../../src/config/supabaseClient", () => {
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
      "Password123!"
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
      "Password123!"
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

  it("valida password sem número ou símbolo", async () => {
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
      "Passwords" // 9 chars, has upper and lower, but no number/symbol
    );

    await waitFor(() => {
      expect(
        screen.getByText(/username is available/i)
      ).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", { name: /register/i });
    expect(registerBtn).toBeEnabled();

    await userEvent.click(registerBtn);

    expect(
      await screen.findByText(/password must contain at least one number or symbol/i)
    ).toBeInTheDocument();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });


  it("mostra erro se o primeiro nome for demasiado curto", async () => {
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
      "J" // 1 caractere
    );
    await userEvent.type(
      screen.getByLabelText(/last name/i),
      "Silva"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "Password123!"
    );

    await waitFor(() => {
      expect(
        screen.getByText(/username is available/i)
      ).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", { name: /register/i });
    await userEvent.click(registerBtn);

    expect(
      await screen.findByText(/first name must be at least 2 characters/i)
    ).toBeInTheDocument();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("mostra erro se o último nome for demasiado comprido", async () => {
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
      "A-super-long-last-name-over-20-chars"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "Password123!"
    );

    await waitFor(() => {
      expect(
        screen.getByText(/username is available/i)
      ).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", { name: /register/i });
    await userEvent.click(registerBtn);

    expect(
      await screen.findByText(/last name must be at most 20 characters/i)
    ).toBeInTheDocument();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("mostra erro se o signUp do supabase devolver erro", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });
    (supabase.auth.signUp as any).mockResolvedValue({
      data: null,
      error: { message: "Something went wrong" },
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
      "Password123!"
    );

    await waitFor(() => {
      expect(
        screen.getByText(/username is available/i)
      ).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", { name: /register/i });
    await userEvent.click(registerBtn);

    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("permite alternar entre mostrar e esconder password", async () => {
    renderWithRouter();

    const input = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const toggleBtn = screen.getByRole("button", {
      name: /show password/i,
    });

    expect(input.type).toBe("password");

    await userEvent.click(toggleBtn);

    // agora aria-label deve ser "Hide password" e o type 'text'
    expect(
      screen.getByRole("button", { name: /hide password/i })
    ).toBeInTheDocument();
    expect(input.type).toBe("text");
  });

  it("mostra estado 'Checking availability…' enquanto verifica username", async () => {
    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/username/i),
      "joao"
    );

    // checkingUsername é definido logo antes do setTimeout
    expect(
      await screen.findByText(/checking availability/i)
    ).toBeInTheDocument();
  });

  it("mostra mensagem de erro se RPC de verificação de username falhar", async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      data: null,
      error: { message: "rpc failure" },
    });

    renderWithRouter();

    await userEvent.type(
      screen.getByLabelText(/username/i),
      "joao"
    );

    await waitFor(() => {
      expect(
        screen.getByText(/could not check username\. try again\./i)
      ).toBeInTheDocument();
    });
  });

  it("mostra erro se o primeiro nome for demasiado comprido", async () => {
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
    "A".repeat(21) // > 20 chars
  );
  await userEvent.type(
    screen.getByLabelText(/last name/i),
    "Silva"
  );
  await userEvent.type(
    screen.getByLabelText(/^password$/i),
    "Password123!"
  );

  await waitFor(() => {
    expect(
      screen.getByText(/username is available/i)
    ).toBeInTheDocument();
  });

  const registerBtn = screen.getByRole("button", { name: /register/i });
  await userEvent.click(registerBtn);

  expect(
    await screen.findByText(/first name must be at most 20 characters/i)
  ).toBeInTheDocument();
  expect(supabase.auth.signUp).not.toHaveBeenCalled();
});

it("mostra erro se o último nome for demasiado curto", async () => {
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
    "Li" // <= 2 chars (2 aqui)
  );
  await userEvent.type(
    screen.getByLabelText(/^password$/i),
    "Password123!"
  );

  await waitFor(() => {
    expect(
      screen.getByText(/username is available/i)
    ).toBeInTheDocument();
  });

  const registerBtn = screen.getByRole("button", { name: /register/i });
  await userEvent.click(registerBtn);

  expect(
    await screen.findByText(/last name must be at least 2 characters/i)
  ).toBeInTheDocument();
  expect(supabase.auth.signUp).not.toHaveBeenCalled();
});

it("mostra erro quando tenta registrar sem username confirmado como disponível", async () => {
  // rpc default: data: true, mas só corre depois do debounce (400ms)
  // Nós vamos submeter ANTES do debounce completar

  const { container } = renderWithRouter();

  // Preencher todos os campos rapidamente
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
    "Password123!"
  );

  // Submeter ANTES do debounce validar o username
  const form = container.querySelector("form");
  fireEvent.submit(form!);

  // Deve mostrar o erro do ramo específico do handleRegister
  expect(
    await screen.findByText(/please choose an available username/i)
  ).toBeInTheDocument();

  expect(supabase.auth.signUp).not.toHaveBeenCalled();
});

  
});
