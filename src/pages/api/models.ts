import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {  const availableModels = [
    'microsoft/phi-3-mini-128k-instruct:free',
    'google/gemma-2-9b-it:free',
    'huggingface/zephyr-7b-beta:free',
    'mistralai/mistral-7b-instruct:free',
    'openchat/openchat-7b:free',
    'gryphe/mythomist-7b:free',
    'undi95/toppy-m-7b:free',
    'openai/gpt-3.5-turbo-instruct',
    'openai/gpt-4o-mini'
  ];

  return new Response(JSON.stringify({
    current: 'microsoft/phi-3-mini-128k-instruct:free',
    available: availableModels,
    note: 'Modele z :free na końcu są darmowe, ale mogą mieć limity rate limit. Sprawdź /api/available-models dla aktualnej listy z OpenRouter API'
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
