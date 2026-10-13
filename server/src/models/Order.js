import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending_payment', 'processing', 'shipped', 'completed', 'cancelled'];
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'expired', 'refunded'];

// Snapshot of the product at checkout time. Later price or name edits do not affect past orders.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    // Final unit price after any discount. This is what the customer paid per item.
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 90 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    // Lets the order page link to the product and open its review form.
    slug: { type: String },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
    // A user id for admin and customer actions, or 'system:midtrans' for payment notifications.
    changedBy: { type: String },
  },
  { _id: false },
);

// Midtrans Snap details. Filled at checkout and updated from the status API.
const paymentSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['midtrans'], default: 'midtrans' },
    snapToken: { type: String },
    redirectUrl: { type: String },
    transactionId: { type: String },
    paymentType: { type: String },
    paidAt: { type: Date },
    rawStatus: { type: String },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (items) => items.length > 0, message: 'Order must contain at least one item' },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentNote: { type: String, trim: true, maxlength: 200 },
    // 'cart' for a normal checkout, 'buy_now' for a single-product purchase that leaves the cart untouched.
    source: { type: String, enum: ['cart', 'buy_now'], default: 'cart' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
    payment: { type: paymentSchema, default: () => ({}) },
    // Unpaid orders are cancelled after this time if no payment arrives.
    paymentExpiresAt: { type: Date, required: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
