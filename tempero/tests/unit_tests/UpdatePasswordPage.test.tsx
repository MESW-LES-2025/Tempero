import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent } from "@testing-library/react";

import UpdatePasswordPage from "../../src/pages/UpdatePasswordPage";
import { supabase } from "../../src/config/supabaseClient";
import { validatePassword } from "../../src/utils/validatePassword";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../src/utils/validatePassword", () => ({
  validatePassword: vi.fn(),
}));

vi.mock("../../src/config/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <UpdatePasswordPage />
    </MemoryRouter>
  );
}

describe("UpdatePasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
    });

    (validatePassword as any).mockReturnValue(null);

    (supabase.auth.updateUser as any).mockResolvedValue({
      data: {},
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza campos e botão", () => {
    renderPage();

    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i })
    ).toBeInTheDocument();
  });

  it("mostra erro se não houver session (link inválido/expirado)", async () => {
    (supabase.auth.getSession as any).mockResolvedValueOnce({
      data: { session: null },
    });

    renderPage();

    expect(
      await screen.findByText(/invalid or expired reset link/i)
    ).toBeInTheDocument();
  });

  it("mostra erro quando passwords não coincidem", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/new password/i), "Password123!");
    await user.type(screen.getByLabelText(/confirm password/i), "Different123!");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("mostra erro quando validatePassword devolve mensagem", async () => {
    (validatePassword as any).mockReturnValueOnce("Password too weak.");

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/new password/i), "weak");
    await user.type(screen.getByLabelText(/confirm password/i), "weak");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/password too weak/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("mostra erro se updateUser falhar", async () => {
    (supabase.auth.updateUser as any).mockResolvedValueOnce({
      data: {},
      error: { message: "Update failed!" },
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/new password/i), "Password123!");
    await user.type(screen.getByLabelText(/confirm password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/update failed!/i)).toBeInTheDocument();
  });

    it(
    "em sucesso: mostra mensagem e navega para /home após 2 segundos",
    async () => {
        renderPage();

        fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: "Password123!" },
        });
        fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "Password123!" },
        });

        fireEvent.click(screen.getByRole("button", { name: /update password/i }));

        expect(
        await screen.findByText(/password updated successfully! redirecting/i)
        ).toBeInTheDocument();

        await waitFor(
        () => {
            expect(mockNavigate).toHaveBeenCalledWith("/home");
        },
        { timeout: 3000 }
        );
    },
    8000
    );

    it(
    "desativa o botão quando msg existe (após sucesso)",
    async () => {
        renderPage();

        fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: "Password123!" },
        });
        fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "Password123!" },
        });

        const btn = screen.getByRole("button", { name: /update password/i });
        expect(btn).toBeEnabled();

        fireEvent.click(btn);

        expect(
        await screen.findByText(/password updated successfully/i)
        ).toBeInTheDocument();

        expect(btn).toBeDisabled();
    },
    8000
    );

});
