import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "No API key configured",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Filtruj tylko darmowe modele
    const freeModels = data.data.filter(
      (model: unknown) =>
        model &&
        typeof model === "object" &&
        "id" in model &&
        typeof (model as { id: string }).id === "string" &&
        ((model as { id: string }).id.includes("free") ||
          (model &&
            typeof model === "object" &&
            "pricing" in model &&
            ((model as { pricing?: { prompt?: string | number } }).pricing?.prompt === "0" ||
              (model as { pricing?: { prompt?: string | number } }).pricing?.prompt === 0)))
    );

    return new Response(
      JSON.stringify(
        {
          totalModels: data.data.length,
          freeModels: freeModels.length,
          recommendedFreeModels: freeModels.slice(0, 10).map((model: unknown) => {
            const typedModel = model as {
              id: string;
              name: string;
              description: string;
              context_length: number;
              pricing: unknown;
            };
            return {
              id: typedModel.id,
              name: typedModel.name,
              description: typedModel.description,
              context_length: typedModel.context_length,
              pricing: typedModel.pricing,
            };
          }),
          currentModel: "microsoft/phi-3-mini-128k-instruct:free",
          testedModels: [
            "microsoft/phi-3-mini-128k-instruct:free",
            "google/gemma-2-9b-it:free",
            "huggingface/zephyr-7b-beta:free",
            "mistralai/mistral-7b-instruct:free",
            "openchat/openchat-7b:free",
          ],
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch models",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
