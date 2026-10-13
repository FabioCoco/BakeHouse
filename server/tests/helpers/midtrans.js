// Mocks the midtrans-client library. Import this file before anything that loads the app.
import { createHash } from 'node:crypto';
import { jest } from '@jest/globals';

export const midtrans = {
  snapFails: false,
  snapCalls: [],
  statusCalls: [],
  // Returns the status body Midtrans would send for an order. Leave null to act as "no transaction yet".
  statusFor: null,
};

export const resetMidtrans = () => {
  midtrans.snapFails = false;
  midtrans.snapCalls = [];
  midtrans.statusCalls = [];
  midtrans.statusFor = null;
};

class MockSnap {
  async createTransaction(params) {
    midtrans.snapCalls.push(params);
    if (midtrans.snapFails) {
      throw new Error('Midtrans is unreachable');
    }
    const orderId = params.transaction_details.order_id;
    return { token: `snap-token-${orderId}`, redirect_url: `https://app.sandbox.midtrans.com/snap/v4/redirection/${orderId}` };
  }
}

class MockCoreApi {
  constructor() {
    this.transaction = {
      status: async (orderId) => {
        midtrans.statusCalls.push(orderId);
        if (!midtrans.statusFor) {
          const err = new Error("Transaction doesn't exist.");
          err.httpStatusCode = 404;
          throw err;
        }
        return midtrans.statusFor(orderId);
      },
    };
  }
}

jest.unstable_mockModule('midtrans-client', () => ({
  default: { Snap: MockSnap, CoreApi: MockCoreApi },
}));

// The same signature Midtrans sends: SHA512(order_id + status_code + gross_amount + server_key).
export const signatureFor = ({ order_id, status_code = '200', gross_amount }) =>
  createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest('hex');

// Builds a notification body that passes signature verification.
export const notificationFor = (fields) => {
  const body = { status_code: '200', ...fields };
  return { ...body, signature_key: signatureFor(body) };
};

// A status response in the shape the Midtrans status API returns.
export const statusBody = (orderId, { transaction_status, fraud_status = 'accept', gross_amount }) => ({
  order_id: orderId,
  status_code: '200',
  transaction_status,
  fraud_status,
  gross_amount: String(gross_amount),
  transaction_id: `tx-${orderId}`,
  payment_type: 'bank_transfer',
});
