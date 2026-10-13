// Mirrors the allowed order status changes the admin can make.
// Keep in sync with ALLOWED_TRANSITIONS in server/src/services/orderService.js.
// pending_payment only moves to processing through the payment webhook, so the admin can only cancel it.
export const VALID_STATUS_TRANSITIONS = {
  pending_payment: ['cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

export const getValidNextStatuses = (current) => VALID_STATUS_TRANSITIONS[current] ?? [];
