import { createHash, timingSafeEqual } from 'node:crypto';
import midtransClient from 'midtrans-client';
import { env } from '../config/env.js';

// Thin wrapper around midtrans-client. Keeping the library behind this file makes the payment flow testable.
const connection = {
  isProduction: env.midtrans.isProduction,
  serverKey: env.midtrans.serverKey,
  clientKey: env.midtrans.clientKey,
};

let snapClient;
let coreClient;
const getSnap = () => (snapClient ??= new midtransClient.Snap(connection));
const getCore = () => (coreClient ??= new midtransClient.CoreApi(connection));

// Creates a Snap transaction and returns { token, redirect_url }.
export const createSnapTransaction = (params) => getSnap().createTransaction(params);

// Asks Midtrans for the live status of a transaction. Never trust a webhook body on its own.
export const getTransactionStatus = (orderId) => getCore().transaction.status(orderId);

// Midtrans signs notifications with SHA512(order_id + status_code + gross_amount + server_key).
export const isValidSignature = ({ order_id, status_code, gross_amount, signature_key }) => {
  if (!order_id || !status_code || !gross_amount || !signature_key) return false;

  const expected = createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${env.midtrans.serverKey}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature_key));
  return a.length === b.length && timingSafeEqual(a, b);
};
