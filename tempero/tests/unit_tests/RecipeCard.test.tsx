import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecipeCard from "../../src/components/RecipeCard";
import { recipeImageUrl } from "../../src/utils/ImageURL";

// mock recipeImageUrl para controlarmos o comportamento de resolveImage
vi.mock("../../src/utils/ImageURL", () => {
  return {
    recipeImageUrl: vi.fn((path: string, width: number) => `https://cdn.test/${width}/${path}`),
  };
});

const mockedRecipeImageUrl = vi.mocked(recipeImageUrl);

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("RecipeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa recipeImageUrl para imagens relativas no variant 'grid' com largura 600", () => {
    const recipe = {
      id: "1",
      title: "Test Recipe",
      image_url: "recipes/test.jpg",
      prep_time: 10,
      cook_time: 20,
      servings: 2,
      difficulty: 3,
    };

    renderWithRouter(<RecipeCard recipe={recipe} />); // default variant = grid

    // recipeImageUrl é chamado com width 600
    expect(mockedRecipeImageUrl).toHaveBeenCalledWith("recipes/test.jpg", 600);

    const img = screen.getByRole("img", { name: /test recipe/i }) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe("https://cdn.test/600/recipes/test.jpg");

    // difficulty numérica -> "3/5"
    expect(screen.getByText(/difficulty:/i).textContent).toMatch(/3\/5/);
  });

  it("não chama recipeImageUrl se a image_url já for absoluta", () => {
    const recipe = {
      id: "2",
      title: "External Image Recipe",
      image_url: "https://example.com/image.jpg",
    };

    renderWithRouter(<RecipeCard recipe={recipe} />);

    expect(mockedRecipeImageUrl).not.toHaveBeenCalled();

    const img = screen.getByRole("img", { name: /external image recipe/i }) as HTMLImageElement;
    expect(img.src).toBe("https://example.com/image.jpg");
  });

  it("mostra placeholder de imagem quando não há image_url no variant 'grid'", () => {
    const recipe = {
      id: "3",
      title: "No Image Recipe",
    };

    const { container } = renderWithRouter(<RecipeCard recipe={recipe} />);

    // não deve haver <img>
    expect(container.querySelector("img")).toBeNull();

    // deve existir o placeholder div com altura 44
    const placeholder = container.querySelector("div.w-full.h-44.bg-gray-200");
    expect(placeholder).not.toBeNull();
  });

  it("renderiza corretamente o variant 'list' com meta pills e usa largura 360", () => {
    const recipe = {
      id: "4",
      title: "List Recipe",
      image_url: "recipes/list.jpg",
      short_description: "Yummy food",
      prep_time: 5,
      cook_time: 15,
      servings: 4,
      difficulty: "Easy",
    };

    const addedAt = "2025-01-01T00:00:00.000Z";

    renderWithRouter(
      <RecipeCard
        recipe={recipe}
        variant="list"
        addedAt={addedAt}
        backgroundColor="#fff5e6"
      />
    );

    // resolveImage chamou recipeImageUrl com largura 360
    expect(mockedRecipeImageUrl).toHaveBeenCalledWith("recipes/list.jpg", 360);

    // título como link
    const links = screen.getAllByRole("link", { name: /list recipe/i });
    expect(links.length).toBeGreaterThanOrEqual(1);

    // descrição
    expect(screen.getByText(/yummy food/i)).toBeInTheDocument();

    // meta pills (MetaPill + formatValue)
    expect(screen.getByText(/prep:/i)).toBeInTheDocument();
    expect(screen.getByText(/\b5 min\b/i)).toBeInTheDocument();

    expect(screen.getByText(/cook:/i)).toBeInTheDocument();
    expect(screen.getByText(/\b15 min\b/i)).toBeInTheDocument();

    expect(screen.getByText(/servings:/i)).toBeInTheDocument();
    expect(screen.getByText(/4/i)).toBeInTheDocument();

    expect(screen.getByText(/difficulty:/i)).toBeInTheDocument();
    expect(screen.getByText(/easy/i)).toBeInTheDocument();
  });

  it("não renderiza MetaPill quando o valor está ausente (via formatValue undefined)", () => {
    const recipe = {
      id: "5",
      title: "Partial Meta Recipe",
      // sem prep_time, sem cook_time, sem servings, sem difficulty
    };

    renderWithRouter(<RecipeCard recipe={recipe} variant="list" />);

    // não há nenhum texto 'Prep:' ou 'Servings:' porque MetaPill retorna null
    expect(screen.queryByText(/prep:/i)).toBeNull();
    expect(screen.queryByText(/servings:/i)).toBeNull();
    expect(screen.queryByText(/difficulty:/i)).toBeNull();
  });
});
