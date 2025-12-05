import { describe, it, expect, vi, beforeEach } from "vitest";
import imageCompression from "browser-image-compression";
import { compressImage } from "../../src/utils/CompressImage";

// mock da lib externa
vi.mock("browser-image-compression", () => ({
  default: vi.fn(async (file: File, options: any) => ({
    mockedCompressedFile: true,
    original: file,
    options,
  })),
}));

describe("compressImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama browser-image-compression com as opções corretas", async () => {
    const file = new File(["dummy"], "test.png", { type: "image/png" });

    const result = await compressImage(file);

    expect(imageCompression).toHaveBeenCalledTimes(1);
    expect(imageCompression).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        maxWidthOrHeight: 1500,
        maxSizeMB: 0.4,
        useWebWorker: true,
      })
    );

    // valor devolvido é o que o mock devolve
    expect((result as any).mockedCompressedFile).toBe(true);
  });
});
