import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadImage, deleteImage } from "../../src/utils/ImageUtils";
import { supabase } from "../../src/config/supabaseClient";
import { compressImage } from "../../src/utils/CompressImage";

// Mock compressImage
vi.mock("../../src/utils/CompressImage", () => {
  const compressImage = vi.fn(async (file: File) => ({
    compressed: true,
    original: file,
  }));
  return { compressImage };
});

// Mock supabase client
vi.mock("../../src/config/supabaseClient", () => {
  const uploadMock = vi.fn(async () => ({ error: null }));
  const removeMock = vi.fn(async () => ({ error: null }));
  const fromMock = vi.fn(() => ({
    upload: uploadMock,
    remove: removeMock,
  }));

  return {
    supabase: {
      storage: {
        from: fromMock,
      },
      // expomos os mocks para acesso fácil nos testes
      __uploadMock: uploadMock,
      __removeMock: removeMock,
      __fromMock: fromMock,
    },
  };
});

describe("ImageUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploadImage comprime a imagem e faz upload com o path correto", async () => {
    const file = new File(["dummy"], "photo.jpeg", { type: "image/jpeg" });

    const path = await uploadImage(file, "recipes");

    const compressMock = vi.mocked(compressImage);
    const uploadMock = (supabase as any).__uploadMock;
    const fromMock = (supabase as any).__fromMock;

    // compressImage chamado
    expect(compressMock).toHaveBeenCalledTimes(1);
    expect(compressMock).toHaveBeenCalledWith(file);

    // storage.from("images") chamado
    expect(fromMock).toHaveBeenCalledWith("images");
    expect(uploadMock).toHaveBeenCalledTimes(1);

    const [calledPath, calledFile, options] = uploadMock.mock.calls[0];

    // path começa com pasta e termina com extensão
    expect(calledPath.startsWith("recipes/")).toBe(true);
    expect(calledPath.endsWith(".jpeg")).toBe(true);

    // ficheiro comprimido
    expect((calledFile as any).compressed).toBe(true);

    // opções
    expect(options).toEqual({ upsert: true });

    // a função devolve o path gerado
    expect(path).toBe(calledPath);
  });

  it("uploadImage lança erro se upload falhar", async () => {
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    const uploadMock = (supabase as any).__uploadMock;

    uploadMock.mockResolvedValueOnce({
      error: new Error("upload failed"),
    });

    await expect(uploadImage(file, "recipes")).rejects.toThrow("upload failed");
  });

  it("deleteImage chama remove com o caminho correto", async () => {
    const removeMock = (supabase as any).__removeMock;
    const fromMock = (supabase as any).__fromMock;

    const path = "recipes/123.jpeg";
    await deleteImage(path);

    expect(fromMock).toHaveBeenCalledWith("images");
    expect(removeMock).toHaveBeenCalledWith([path]);
  });

  it("deleteImage lança erro se remove falhar", async () => {
    const removeMock = (supabase as any).__removeMock;

    removeMock.mockResolvedValueOnce({
      error: new Error("delete failed"),
    });

    await expect(deleteImage("recipes/123.jpeg")).rejects.toThrow(
      "delete failed"
    );
  });
});

