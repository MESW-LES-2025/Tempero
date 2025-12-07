import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadRecipePage from "../../src/pages/UploadRecipePage";
import { supabase } from "../../src/config/supabaseClient";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

/*Mock react-router-dom (navigate)*/
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/*Mock image helpers*/
vi.mock("../../src/utils/CompressImage", () => ({
  compressImage: vi.fn(async (file: File) => file),
}));

vi.mock("../../src/utils/ImageUtils", () => ({
  uploadImage: vi.fn(async (file: File, folder: string) => `${folder}/fake-image.jpg`),
  deleteImage: vi.fn(async (path: string) => {}),
}));

/*Mock Supabase*/
vi.mock("../../src/config/supabaseClient", () => {
  const mockAuthGetUser = vi.fn();
  const mockFrom = vi.fn((table: string) => {
    switch (table) {
      case "recipes":
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: "recipe-1" },
                error: null,
              }),
            })),
          })),
        };
      case "recipe-ingredients":
      case "recipe-steps":
      case "recipe-tags":
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
    case "tags":
      return {
        upsert: vi.fn(() => ({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1, name: "pasta" }], // pelo menos um tag com id
            error: null,
          }),
        })),
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      };
      default:
        return {
          select: vi.fn(() => ({
            ilike: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
    }
  });

  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });

  return {
    supabase: {
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: mockRpc,
      __mockAuthGetUser: mockAuthGetUser,
      __mockFrom: mockFrom,
    },
  };
});

const mockedAuthGetUser = (supabase as any).__mockAuthGetUser;

/* ---------- Helper render ---------- */
const renderPage = () =>
  render(
    <MemoryRouter>
      <UploadRecipePage />
    </MemoryRouter>
  );

describe("UploadRecipePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("faz upload de imagem JPG, chama compressImage e uploadImage e guarda imagePath", async () => {
    // user logado para não haver stresses mais tarde
    mockedAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const { container } = renderPage();

    // Ir até Media (igual aos outros testes)
    fireEvent.change(
      screen.getByPlaceholderText(/recipe title/i),
      { target: { value: "My Test Recipe" } }
    );
    fireEvent.change(
      screen.getByLabelText(/short description/i),
      { target: { value: "Tasty dish" } }
    );
    fireEvent.change(
      screen.getByLabelText(/preparation time/i),
      { target: { value: "10" } }
    );
    fireEvent.change(
      screen.getByLabelText(/cooking time/i),
      { target: { value: "20" } }
    );
    fireEvent.change(
      screen.getByLabelText(/servings/i),
      { target: { value: "2" } }
    );
    fireEvent.change(
      screen.getByLabelText(/difficulty/i),
      { target: { value: "1" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/ingredients/i);

    fireEvent.click(
      screen.getByRole("button", { name: /add ingredient/i })
    );
    fireEvent.change(
      screen.getByPlaceholderText(/ingredient/i),
      { target: { value: "Flour" } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(/amt/i),
      { target: { value: "200" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText(/steps/i);
    fireEvent.click(
      screen.getByRole("button", { name: /add step/i })
    );
    fireEvent.change(
      screen.getByPlaceholderText(/describe step 1/i),
      { target: { value: "Mix everything." } }
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText(/media/i);

    // mock do createObjectURL para o preview
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:preview-url");

    const fileInput = screen.getByLabelText(/cover image/i) as HTMLInputElement;

    const goodFile = new File(["dummy"], "image.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(fileInput, { target: { files: [goodFile] } });

    // compressImage e uploadImage são mocks definidos no topo
    const { compressImage } = await import("../../src/utils/CompressImage");
    const { uploadImage } = await import("../../src/utils/ImageUtils");

    await waitFor(() => {
      expect(compressImage).toHaveBeenCalledWith(goodFile);
      expect(uploadImage).toHaveBeenCalledWith(goodFile, "recipes");
    });

    // preview foi renderizado
    expect(
      screen.getByRole("img", { name: /preview/i })
    ).toBeInTheDocument();

    createObjectURLSpy.mockRestore();
  });

  it("renders initial UI with title and first step", () => {
    renderPage();

    // Page title
    expect(
      screen.getByText(/upload a recipe/i)
    ).toBeInTheDocument();

    // First step title
    expect(screen.getByText(/details/i)).toBeInTheDocument();

    // Step indicator
    expect(screen.getByText(/step 1 \/ 5/i)).toBeInTheDocument();

    // "Next" button present
    expect(
      screen.getByRole("button", { name: /next/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors when trying to go next with empty details", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // We expect the first-step validations to fire
    expect(
      screen.getByText(/title is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/short description is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/preparation time is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/cooking time is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/difficulty is required/i)
    ).toBeInTheDocument();
  });

  it("goes to ingredients step after filling valid details", async () => {
    renderPage();

    // Fill Details step
    fireEvent.change(
      screen.getByPlaceholderText(/recipe title/i),
      { target: { value: "My Test Recipe" } }
    );

    fireEvent.change(
      screen.getByLabelText(/short description/i),
      { target: { value: "Tasty dish" } }
    );

    fireEvent.change(
      screen.getByLabelText(/preparation time/i),
      { target: { value: "10" } }
    );

    fireEvent.change(
      screen.getByLabelText(/cooking time/i),
      { target: { value: "20" } }
    );

    fireEvent.change(
      screen.getByLabelText(/servings/i),
      { target: { value: "2" } }
    );

    fireEvent.change(
      screen.getByLabelText(/difficulty/i),
      { target: { value: "1" } } // 1 — Very easy
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/ingredients/i)
      ).toBeInTheDocument();
    });
  });

  it("submits successfully and navigates to new recipe page", async () => {
    // User is logged in
    mockedAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    renderPage();

    //Step 1: Details
    fireEvent.change(
      screen.getByPlaceholderText(/recipe title/i),
      { target: { value: "My Test Recipe" } }
    );

    fireEvent.change(
      screen.getByLabelText(/short description/i),
      { target: { value: "Tasty dish" } }
    );

    fireEvent.change(
      screen.getByLabelText(/preparation time/i),
      { target: { value: "10" } }
    );

    fireEvent.change(
      screen.getByLabelText(/cooking time/i),
      { target: { value: "20" } }
    );

    fireEvent.change(
      screen.getByLabelText(/servings/i),
      { target: { value: "2" } }
    );

    fireEvent.change(
      screen.getByLabelText(/difficulty/i),
      { target: { value: "1" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    //Step 2: Ingredients
    await screen.findByText(/ingredients/i);

    fireEvent.click(
      screen.getByRole("button", { name: /add ingredient/i })
    );

    // Fill first ingredient
    fireEvent.change(
      screen.getByPlaceholderText(/ingredient/i),
      { target: { value: "Flour" } }
    );

    fireEvent.change(
      screen.getByPlaceholderText(/amt/i),
      { target: { value: "200" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    //Step 3: Steps
    await screen.findByText(/steps/i);

    fireEvent.click(
      screen.getByRole("button", { name: /add step/i })
    );

    fireEvent.change(
      screen.getByPlaceholderText(/describe step 1/i),
      { target: { value: "Mix everything." } }
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    //Step 4: Media
    await screen.findByText(/media/i);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    //Step 5: Review
    await screen.findByText(/^review$/i);

    fireEvent.click(
      screen.getByRole("button", { name: /publish/i })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/recipe/recipe-1");
    });
  });

  it("shows error if user is not logged in when publishing", async () => {
    // auth.getUser returns no user
    mockedAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    renderPage();

    // Fill Details minimally valid
    fireEvent.change(
      screen.getByPlaceholderText(/recipe title/i),
      { target: { value: "My Test Recipe" } }
    );
    fireEvent.change(
      screen.getByLabelText(/short description/i),
      { target: { value: "Tasty dish" } }
    );
    fireEvent.change(
      screen.getByLabelText(/preparation time/i),
      { target: { value: "10" } }
    );
    fireEvent.change(
      screen.getByLabelText(/cooking time/i),
      { target: { value: "20" } }
    );
    fireEvent.change(
      screen.getByLabelText(/servings/i),
      { target: { value: "2" } }
    );
    fireEvent.change(
      screen.getByLabelText(/difficulty/i),
      { target: { value: "1" } }
    );

    // Next -> Ingredients
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/ingredients/i);

    fireEvent.click(
      screen.getByRole("button", { name: /add ingredient/i })
    );
    fireEvent.change(
      screen.getByPlaceholderText(/ingredient/i),
      { target: { value: "Flour" } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(/amt/i),
      { target: { value: "200" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Steps
    await screen.findByText(/steps/i);
    fireEvent.click(
      screen.getByRole("button", { name: /add step/i })
    );
    fireEvent.change(
      screen.getByPlaceholderText(/describe step 1/i),
      { target: { value: "Mix everything." } }
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Media
    await screen.findByText(/media/i);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Review
    await screen.findByRole("heading", { name: "Review", level: 2 });

    fireEvent.click(
      screen.getByRole("button", { name: /publish/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/you must be logged in to upload a recipe/i)
      ).toBeInTheDocument();
    });
  });

  it("mostra erros de validação de ingredientes no passo 2", async () => {
    renderPage();

    // Step 1: detalhes válidos
    fireEvent.change(
      screen.getByPlaceholderText(/recipe title/i),
      { target: { value: "My Test Recipe" } }
    );
    fireEvent.change(
      screen.getByLabelText(/short description/i),
      { target: { value: "Tasty dish" } }
    );
    fireEvent.change(
      screen.getByLabelText(/preparation time/i),
      { target: { value: "10" } }
    );
    fireEvent.change(
      screen.getByLabelText(/cooking time/i),
      { target: { value: "20" } }
    );
    fireEvent.change(
      screen.getByLabelText(/servings/i),
      { target: { value: "2" } }
    );
    fireEvent.change(
      screen.getByLabelText(/difficulty/i),
      { target: { value: "1" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/ingredients/i);

    // 1) Sem ingredientes
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(
      screen.getByText(/add at least one ingredient/i)
    ).toBeInTheDocument();

    // 2) Com ingrediente mas sem nome e amount inválido
    fireEvent.click(
      screen.getByRole("button", { name: /add ingredient/i })
    );

    // amount = 0 → inválido
    fireEvent.change(
      screen.getByPlaceholderText(/amt/i),
      { target: { value: "0" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(
      screen.getByText(/ingredient 1: name is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ingredient 1: amount is required/i)
    ).toBeInTheDocument();
});
it("mostra erros de validação de passos no passo 3", async () => {
  renderPage();

  // Step 1: detalhes
  fireEvent.change(
    screen.getByPlaceholderText(/recipe title/i),
    { target: { value: "My Test Recipe" } }
  );
  fireEvent.change(
    screen.getByLabelText(/short description/i),
    { target: { value: "Tasty dish" } }
  );
  fireEvent.change(
    screen.getByLabelText(/preparation time/i),
    { target: { value: "10" } }
  );
  fireEvent.change(
    screen.getByLabelText(/cooking time/i),
    { target: { value: "20" } }
  );
  fireEvent.change(
    screen.getByLabelText(/servings/i),
    { target: { value: "2" } }
  );
  fireEvent.change(
    screen.getByLabelText(/difficulty/i),
    { target: { value: "1" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  await screen.findByText(/ingredients/i);

  // Step 2: ingrediente mínimo válido
  fireEvent.click(
    screen.getByRole("button", { name: /add ingredient/i })
  );
  fireEvent.change(
    screen.getByPlaceholderText(/ingredient/i),
    { target: { value: "Flour" } }
  );
  fireEvent.change(
    screen.getByPlaceholderText(/amt/i),
    { target: { value: "200" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Step 3: Steps
  await screen.findByText(/steps/i);

  // 1) Sem steps
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  expect(
    screen.getByText(/add at least one step/i)
  ).toBeInTheDocument();

  // 2) Com step mas descrição vazia
  fireEvent.click(
    screen.getByRole("button", { name: /add step/i })
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  expect(
    screen.getByText(/step 1: description is required/i)
  ).toBeInTheDocument();
});
it("desativa o botão Back no primeiro passo e volta ao passo anterior quando clicado", async () => {
  renderPage();

  const backBtn = screen.getByRole("button", { name: /back/i });
  expect(backBtn).toBeDisabled();

  // avançar para Ingredients
  fireEvent.change(
    screen.getByPlaceholderText(/recipe title/i),
    { target: { value: "My Test Recipe" } }
  );
  fireEvent.change(
    screen.getByLabelText(/short description/i),
    { target: { value: "Tasty dish" } }
  );
  fireEvent.change(
    screen.getByLabelText(/preparation time/i),
    { target: { value: "10" } }
  );
  fireEvent.change(
    screen.getByLabelText(/cooking time/i),
    { target: { value: "20" } }
  );
  fireEvent.change(
    screen.getByLabelText(/servings/i),
    { target: { value: "2" } }
  );
  fireEvent.change(
    screen.getByLabelText(/difficulty/i),
    { target: { value: "1" } }
  );

  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  await screen.findByText(/ingredients/i);

  const backBtnAfter = screen.getByRole("button", { name: /back/i });
  expect(backBtnAfter).not.toBeDisabled();

  fireEvent.click(backBtnAfter);

  await screen.findByText(/details/i);
  expect(
    screen.getByText(/step 1 \/ 5/i)
  ).toBeInTheDocument();
});

it("mostra 'No suggestions', permite adicionar e remover tags na review", async () => {
  renderPage();

  // Ir até Review (igual ao fluxo de submit, mas sem publicar)
  // Step 1
  fireEvent.change(
    screen.getByPlaceholderText(/recipe title/i),
    { target: { value: "My Test Recipe" } }
  );
  fireEvent.change(
    screen.getByLabelText(/short description/i),
    { target: { value: "Tasty dish" } }
  );
  fireEvent.change(
    screen.getByLabelText(/preparation time/i),
    { target: { value: "10" } }
  );
  fireEvent.change(
    screen.getByLabelText(/cooking time/i),
    { target: { value: "20" } }
  );
  fireEvent.change(
    screen.getByLabelText(/servings/i),
    { target: { value: "2" } }
  );
  fireEvent.change(
    screen.getByLabelText(/difficulty/i),
    { target: { value: "1" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  await screen.findByText(/ingredients/i);

  // Step 2
  fireEvent.click(
    screen.getByRole("button", { name: /add ingredient/i })
  );
  fireEvent.change(
    screen.getByPlaceholderText(/ingredient/i),
    { target: { value: "Flour" } }
  );
  fireEvent.change(
    screen.getByPlaceholderText(/amt/i),
    { target: { value: "200" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Step 3
  await screen.findByText(/steps/i);
  fireEvent.click(
    screen.getByRole("button", { name: /add step/i })
  );
  fireEvent.change(
    screen.getByPlaceholderText(/describe step 1/i),
    { target: { value: "Mix everything." } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Step 4 -> 5
  await screen.findByText(/media/i);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Agora estamos em Review
  await screen.findByRole("heading", { name: "Review", level: 2 });

  const tagInput = screen.getByPlaceholderText(/add tag and press enter/i);

  // Escrever para ativar o useEffect de sugestões
  fireEvent.change(tagInput, { target: { value: "pasta" } });

  // rpc devolve [] por defeito -> "No suggestions"
  await waitFor(() => {
    expect(
      screen.getByText(/no suggestions/i)
    ).toBeInTheDocument();
  });

  // Enter -> adiciona tag
  fireEvent.keyDown(tagInput, { key: "Enter", code: "Enter", charCode: 13 });

  expect(
    await screen.findByText("pasta")
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/no tags/i)
  ).not.toBeInTheDocument();

  // Remover tag
  fireEvent.click(
    screen.getByRole("button", { name: /remove tag pasta/i })
  );

  expect(
    await screen.findByText(/no tags/i)
  ).toBeInTheDocument();
});
it("usa resultados do RPC de tags para sugestões e permite escolher uma", async () => {
  (supabase.rpc as any).mockResolvedValueOnce({
    data: [{ id: 1, name: "pasta" }],
    error: null,
  });

  renderPage();



  // Step 1
  fireEvent.change(
    screen.getByPlaceholderText(/recipe title/i),
    { target: { value: "My Test Recipe" } }
  );
  fireEvent.change(
    screen.getByLabelText(/short description/i),
    { target: { value: "Tasty dish" } }
  );
  fireEvent.change(
    screen.getByLabelText(/preparation time/i),
    { target: { value: "10" } }
  );
  fireEvent.change(
    screen.getByLabelText(/cooking time/i),
    { target: { value: "20" } }
  );
  fireEvent.change(
    screen.getByLabelText(/servings/i),
    { target: { value: "2" } }
  );
  fireEvent.change(
    screen.getByLabelText(/difficulty/i),
    { target: { value: "1" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  await screen.findByText(/ingredients/i);

  // ingrediente mínimo
  fireEvent.click(
    screen.getByRole("button", { name: /add ingredient/i })
  );
  fireEvent.change(
    screen.getByPlaceholderText(/ingredient/i),
    { target: { value: "Flour" } }
  );
  fireEvent.change(
    screen.getByPlaceholderText(/amt/i),
    { target: { value: "200" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // step mínimo
  await screen.findByText(/steps/i);
  fireEvent.click(
    screen.getByRole("button", { name: /add step/i })
  );
  fireEvent.change(
    screen.getByPlaceholderText(/describe step 1/i),
    { target: { value: "Mix everything." } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByText(/media/i);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByRole("heading", { name: "Review", level: 2 });

  const tagInput = screen.getByPlaceholderText(/add tag and press enter/i);
  fireEvent.change(tagInput, { target: { value: "pa" } });

  const suggestionBtn = await screen.findByRole("button", { name: "pasta" });
  fireEvent.click(suggestionBtn);

  expect(
    await screen.findByText("pasta")
  ).toBeInTheDocument();
});

it("mostra alerta se for carregada imagem que não é JPG/JPEG", async () => {
  renderPage();

  // Ir até Media
  // Step 1
  fireEvent.change(
    screen.getByPlaceholderText(/recipe title/i),
    { target: { value: "My Test Recipe" } }
  );
  fireEvent.change(
    screen.getByLabelText(/short description/i),
    { target: { value: "Tasty dish" } }
  );
  fireEvent.change(
    screen.getByLabelText(/preparation time/i),
    { target: { value: "10" } }
  );
  fireEvent.change(
    screen.getByLabelText(/cooking time/i),
    { target: { value: "20" } }
  );
  fireEvent.change(
    screen.getByLabelText(/servings/i),
    { target: { value: "2" } }
  );
  fireEvent.change(
    screen.getByLabelText(/difficulty/i),
    { target: { value: "1" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  await screen.findByText(/ingredients/i);

  // Step 2 - ingrediente mínimo
  fireEvent.click(
    screen.getByRole("button", { name: /add ingredient/i })
  );
  fireEvent.change(
    screen.getByPlaceholderText(/ingredient/i),
    { target: { value: "Flour" } }
  );
  fireEvent.change(
    screen.getByPlaceholderText(/amt/i),
    { target: { value: "200" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Step 3 - step mínimo
  await screen.findByText(/steps/i);
  fireEvent.click(
    screen.getByRole("button", { name: /add step/i })
  );
  fireEvent.change(
    screen.getByPlaceholderText(/describe step 1/i),
    { target: { value: "Mix everything." } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Step 4 - Media
  await screen.findByText(/media/i);

  const alertSpy = vi
    .spyOn(window, "alert")
    .mockImplementation(() => {});

  const fileInput = screen.getByLabelText(/cover image/i) as HTMLInputElement;

  const badFile = new File(["dummy"], "image.png", {
    type: "image/png",
  });

  fireEvent.change(fileInput, { target: { files: [badFile] } });

  await waitFor(() => {
    expect(alertSpy).toHaveBeenCalled();
  });

  alertSpy.mockRestore();
});

const renderEditingPage = () =>
  render(
    <MemoryRouter initialEntries={["/upload?recipeId=recipe-1"]}>
      <UploadRecipePage />
    </MemoryRouter>
  );

it("mostra erro se tentar editar sem estar autenticado", async () => {
  mockedAuthGetUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });

  renderEditingPage();

  await waitFor(() => {
    expect(
      screen.getByText(/you must be logged in to edit a recipe/i)
    ).toBeInTheDocument();
  });

  expect(
    screen.getByText(/edit recipe/i)
  ).toBeInTheDocument();
});

it("submete com tags e passa pelo fluxo de upsert de tags", async () => {
  // User logged in
  mockedAuthGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });

  renderPage();

  // Step 1: Details
  fireEvent.change(
    screen.getByPlaceholderText(/recipe title/i),
    { target: { value: "My Test Recipe" } }
  );
  fireEvent.change(
    screen.getByLabelText(/short description/i),
    { target: { value: "Tasty dish" } }
  );
  fireEvent.change(
    screen.getByLabelText(/preparation time/i),
    { target: { value: "10" } }
  );
  fireEvent.change(
    screen.getByLabelText(/cooking time/i),
    { target: { value: "20" } }
  );
  fireEvent.change(
    screen.getByLabelText(/servings/i),
    { target: { value: "2" } }
  );
  fireEvent.change(
    screen.getByLabelText(/difficulty/i),
    { target: { value: "1" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Step 2: Ingredients
  await screen.findByText(/ingredients/i);
  fireEvent.click(
    screen.getByRole("button", { name: /add ingredient/i })
  );
  fireEvent.change(
    screen.getByPlaceholderText(/ingredient/i),
    { target: { value: "Flour" } }
  );
  fireEvent.change(
    screen.getByPlaceholderText(/amt/i),
    { target: { value: "200" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Step 3: Steps
  await screen.findByText(/steps/i);
  fireEvent.click(
    screen.getByRole("button", { name: /add step/i })
  );
  fireEvent.change(
    screen.getByPlaceholderText(/describe step 1/i),
    { target: { value: "Mix everything." } }
  );
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Step 4: Media
  await screen.findByText(/media/i);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  // Step 5: Review
  await screen.findByRole("heading", { name: "Review", level: 2 });

  // ➜ Adicionar tag para ativar bloco de tags no submit
  const tagInput = screen.getByPlaceholderText(/add tag and press enter/i);
  fireEvent.change(tagInput, { target: { value: "pasta" } });
  fireEvent.keyDown(tagInput, { key: "Enter", code: "Enter", charCode: 13 });

  // Publicar
  fireEvent.click(
    screen.getByRole("button", { name: /publish/i })
  );

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/recipe/recipe-1");
  });
});
 it("mostra erro genérico quando ocorre falha ao guardar a receita", async () => {
  mockedAuthGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });

  const originalRpc = supabase.rpc;
  (supabase as any).rpc = vi.fn((fnName: string, args: any) => {
    if (fnName === "replace_recipe_ingredients") {
      return Promise.resolve({
        data: null,
        error: { message: "ingredients failed via RPC" },
      });
    }
    return originalRpc(fnName, args);
  });

  renderPage();

  fireEvent.change(screen.getByPlaceholderText(/recipe title/i), { target: { value: "My Test Recipe" } });
  fireEvent.change(screen.getByLabelText(/short description/i), { target: { value: "Tasty dish" } });
  fireEvent.change(screen.getByLabelText(/preparation time/i), { target: { value: "10" } });
  fireEvent.change(screen.getByLabelText(/cooking time/i), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText(/servings/i), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText(/difficulty/i), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByText(/ingredients/i);
  fireEvent.click(screen.getByRole("button", { name: /add ingredient/i }));
  fireEvent.change(screen.getByPlaceholderText(/ingredient/i), { target: { value: "Flour" } });
  fireEvent.change(screen.getByPlaceholderText(/amt/i), { target: { value: "200" } });
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByText(/steps/i);
  fireEvent.click(screen.getByRole("button", { name: /add step/i }));
  fireEvent.change(screen.getByPlaceholderText(/describe step 1/i), { target: { value: "Mix everything." } });
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByText(/media/i);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByRole("heading", { name: "Review", level: 2 });
  fireEvent.click(screen.getByRole("button", { name: /publish/i }));

  expect(await screen.findByText(/something went wrong while saving the recipe/i)).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();

  (supabase as any).rpc = originalRpc;
});

it("carrega receita existente para edição e faz update (usa upsert em recipes)", async () => {
  // user autenticado
  mockedAuthGetUser.mockResolvedValue({
    data: { user: { id: "author-1" } },
    error: null,
  });

  const originalFrom = supabase.from;

  // mock especial só para este teste
  (supabase as any).from = vi.fn((table: string) => {
    if (table === "recipes") {
      // 1) load da receita para edição (useEffect)
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "recipe-1",
              title: "Existing Recipe",
              short_description: "Existing short desc",
              image_url: null,
              difficulty: 2,
              servings: 3,
              authorId: "author-1",
              prep_time: 5,
              cook_time: 10,
              recipe_ingredients: [
                {
                  id: 1,
                  name: "Flour",
                  amount: 200,
                  unit: "g",
                  notes: null,
                },
              ],
              recipe_steps: [
                { index: 1, text: "Mix everything." },
              ],
              recipe_tags: [
                { tags: { name: "pasta" } },
              ],
            },
            error: null,
          }),
        })),
      }));

      // 2) update via upsert em submit()
      const upsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: "recipe-1" },
            error: null,
          }),
        })),
      }));

      return {
        select,
        upsert,
        insert: vi.fn(), // não usado neste teste
      };
    }

    // resto das tabelas usa o comportamento mock original
    return originalFrom(table as any);
  });

  // render já em modo edição
  render(
    <MemoryRouter initialEntries={["/upload?recipeId=recipe-1"]}>
      <UploadRecipePage />
    </MemoryRouter>
  );

  // espera pelo load dos detalhes
  await waitFor(() => {
    expect(
      screen.getByDisplayValue("Existing Recipe")
    ).toBeInTheDocument();
  });

  // avança pelos passos (já vêm preenchidos)
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  await screen.findByText(/ingredients/i);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByText(/steps/i);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByText(/media/i);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByRole("heading", { name: "Review", level: 2 });

  // clicar em Update (não Publish)
  fireEvent.click(
    screen.getByRole("button", { name: /update/i })
  );

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/recipe/recipe-1");
  });

  // restaurar o from original para não estragar outros testes
  (supabase as any).from = originalFrom;
});


});
