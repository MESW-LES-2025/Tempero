import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import EditProfilePage from "../../src/pages/EditProfilePage";
import { supabase } from "../../src/config/supabaseClient";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadImage, deleteImage } from "../../src/utils/ImageUtils";


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

// Mock Image utils
vi.mock("../../src/utils/ImageUtils", () => {
  const uploadImage = vi.fn(async (file: File, folder: string) => `${folder}/fake-image.jpg`);
  const deleteImage = vi.fn(async (_path: string) => {});
  return { uploadImage, deleteImage };
});

// Mock profileImageUrl para não depender de Supabase
vi.mock("../../src/utils/ImageURL", () => ({
  profileImageUrl: vi.fn((path: string) => `https://cdn/${path}`),
}));

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

  it("entra no ramo de erro ao obter o perfil (mantém o loader)", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "123" } },
    });

    mockedSelect.mockResolvedValue({
      data: null,
      error: { message: "Fetch failed" },
    });

    renderPage();

    // O efeito corre, mas loading nunca é posto a false
    await waitFor(() => {
      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });

  });

  it("mostra erro se o ficheiro carregado não for uma imagem", async () => {
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

    const { container } = renderPage();

    // Esperar pelo form carregado
    await screen.findByLabelText("First name");

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(["dummy"], "file.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(
      await screen.findByText(/please upload a valid image file/i)
    ).toBeInTheDocument();

    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("faz upload de nova imagem de perfil e apaga a antiga", async () => {
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
        profile_picture_url: "profiles/old.jpg",
      },
      error: null,
    });

    const { container } = renderPage();

    await screen.findByLabelText("First name");

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const imgFile = new File(["dummy"], "avatar.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, { target: { files: [imgFile] } });

    // deleteImage chamado com a imagem antiga
    await waitFor(() => {
      expect(deleteImage).toHaveBeenCalledWith("profiles/old.jpg");
    });

    // uploadImage chamado com o novo ficheiro
    expect(uploadImage).toHaveBeenCalledWith(imgFile, "profiles");

    // mensagem de sucesso
    expect(
      await screen.findByText(/image uploaded successfully/i)
    ).toBeInTheDocument();
  });

  it("mostra erro se o upload da imagem falhar", async () => {
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

    (uploadImage as any).mockRejectedValueOnce(new Error("Upload failed"));

    const { container } = renderPage();

    await screen.findByLabelText("First name");

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const imgFile = new File(["dummy"], "avatar.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, { target: { files: [imgFile] } });

    expect(
      await screen.findByText(/upload failed/i)
    ).toBeInTheDocument();
  });

  it("navega para trás quando o utilizador clica em Cancel", async () => {
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

    renderPage();

    await screen.findByLabelText("First name");

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

});
