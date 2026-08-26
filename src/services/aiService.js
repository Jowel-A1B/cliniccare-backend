// Adapter pattern (same shape as paymentService.js): every provider exposes
// the same `complete(prompt, system)` function, so controllers never care
// which model is behind it. Swap AI_PROVIDER=anthropic in .env once you have
// a real API key — nothing else in the codebase changes.
const env = require('../config/env');

const DISCLAIMER =
  'This is guidance only, not a medical diagnosis. Please consult a doctor for an accurate assessment.';

// Mock provider: deterministic, clearly-labeled canned responses so the full
// UX (symptom checker, chatbot) is demoable with zero setup and zero cost.
const mockProvider = {
  async complete(prompt) {
    return (
      `[MOCK AI RESPONSE — set AI_PROVIDER=anthropic and ANTHROPIC_API_KEY in .env for real answers]\n\n` +
      `Based on what you described, this looks like something a general physician ` +
      `should evaluate first. ${DISCLAIMER}`
    );
  },
};

let anthropicClient = null;
const anthropicProvider = {
  async complete(prompt, system) {
    if (!env.ai.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in .env — cannot use the anthropic AI provider.');
    }
    if (!anthropicClient) {
      const Anthropic = require('@anthropic-ai/sdk');
      anthropicClient = new Anthropic({ apiKey: env.ai.anthropicApiKey });
    }
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  },
};

const PROVIDERS = { mock: mockProvider, anthropic: anthropicProvider };

function getAiProvider() {
  return PROVIDERS[env.ai.provider] || mockProvider;
}

module.exports = { getAiProvider, DISCLAIMER };
