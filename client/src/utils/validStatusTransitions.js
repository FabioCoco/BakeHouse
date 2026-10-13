// Mirrors the allowed order status changes the admin can make.
// Keep in sync with the server rules in server/src/services/orderService.js.
export const VALID_STATUS_TRANSITIONS = {
  pending_confirmation: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

export const getValidNextStatuses = (current) => VALID_STATUS_TRANSITIONS[current] ?? [];
