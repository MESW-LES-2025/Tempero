import { describe, it, expect, vi, beforeEach } from "vitest";
import { recipeImageUrl, profileImageUrl } from "../../src/utils/ImageURL";
import { supabase } from "../../src/config/supabaseClient";

vi.mock("../../src/config/supabaseClient", () => {
  return {
    supabase: {
      storage: {
        from: vi.fn(() => ({
          getPublicUrl: vi.fn((path, opts) => ({
            data: { publicUrl: `https://fake.public/${path}` },
          })),
        })),
      },
    },
  };
});

describe("Image URL Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recipeImageUrl returns undefined for null, undefined, or empty path", () => {
    expect(recipeImageUrl(null)).toBeUndefined();
    expect(recipeImageUrl(undefined)).toBeUndefined();
    expect(recipeImageUrl("")).toBeUndefined();
  });

  it("recipeImageUrl returns generated URL when path is valid", () => {
    const url = recipeImageUrl("recipes/img.jpg");
    expect(url).toBe("https://fake.public/recipes/img.jpg");
  });

  it("profileImageUrl returns undefined for null, undefined, or empty path", () => {
    expect(profileImageUrl(null)).toBeUndefined();
    expect(profileImageUrl(undefined)).toBeUndefined();
    expect(profileImageUrl("")).toBeUndefined();
  });

  it("profileImageUrl returns generated URL when path is valid", () => {
    const url = profileImageUrl("profiles/pic.jpg");
    expect(url).toBe("https://fake.public/profiles/pic.jpg");
  });
});
