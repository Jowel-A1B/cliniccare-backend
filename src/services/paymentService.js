// Adapter pattern: every provider exposes the same two functions so
// controllers never need to know which gateway is active. Swap
// env.payment.provider from "mock" to "bkash"/"sslcommerz" once you have
// real merchant credentials and fill in that adapter's two functions —
// nothing else in the codebase changes.
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

const mockProvider = {
  // Returns a fake checkout URL. In dev/demo, the frontend just shows a
  // "Confirm Payment" button that calls /payments/confirm directly.
  initiate: async ({ amount, invoiceId }) => {
    const transactionId = `MOCK-${uuidv4()}`;
    return { transactionId, paymentUrl: `${env.clientUrl}/pay/confirm?tx=${transactionId}` };
  },
  // Mock always succeeds instantly — good enough for demoing the full flow.
  confirm: async ({ transactionId }) => ({ success: true, transactionId }),
};

const notConfiguredProvider = (name) => ({
  initiate: async () => {
    throw new Error(`${name} is not configured yet — add credentials in .env and implement services/paymentService.js`);
  },
  confirm: async () => {
    throw new Error(`${name} is not configured yet`);
  },
});

const PROVIDERS = {
  mock: mockProvider,
  bkash: notConfiguredProvider('bKash'),
  nagad: notConfiguredProvider('Nagad'),
  sslcommerz: notConfiguredProvider('SSLCommerz'),
};

function getProvider(name) {
  return PROVIDERS[name || env.payment.provider] || mockProvider;
}

module.exports = { getProvider };
