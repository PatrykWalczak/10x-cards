import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({
      error: 'No API key configured'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Filtruj tylko darmowe modele
    const freeModels = data.data.filter((model: any) => 
      model.id.includes('free') || model.pricing?.prompt === '0' || model.pricing?.prompt === 0
    );

    return new Response(JSON.stringify({
      totalModels: data.data.length,
      freeModels: freeModels.length,
      recommendedFreeModels: freeModels.slice(0, 10).map((model: any) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        context_length: model.context_length,
        pricing: model.pricing
      })),
      currentModel: 'microsoft/phi-3-mini-128k-instruct:free',
      testedModels: [
        'microsoft/phi-3-mini-128k-instruct:free',
        'google/gemma-2-9b-it:free',
        'huggingface/zephyr-7b-beta:free',
        'mistralai/mistral-7b-instruct:free',
        'openchat/openchat-7b:free'
      ]
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch models',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
