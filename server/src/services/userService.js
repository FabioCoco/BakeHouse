import { ApiError } from '../utils/ApiError.js';

// Keeps exactly one default address when any addresses exist.
// `preferredId` becomes the default. `excludeId` is never picked as a fallback default.
const normalizeDefault = (addresses, { preferredId, excludeId } = {}) => {
  if (addresses.length === 0) return;

  if (preferredId) {
    addresses.forEach((address) => {
      address.isDefault = String(address._id) === String(preferredId);
    });
    return;
  }

  if (!addresses.some((address) => address.isDefault)) {
    // Prefer another address; use the excluded one only when it is the last left.
    const fallback = addresses.find((address) => String(address._id) !== String(excludeId)) ?? addresses[0];
    fallback.isDefault = true;
  }
};

const findAddress = (user, addressId) => {
  const address = user.addresses.id(addressId);
  if (!address) {
    throw ApiError.notFound('Address not found');
  }
  return address;
};

export const listAddresses = (user) => user.addresses;

export const addAddress = async (user, data) => {
  const isFirst = user.addresses.length === 0;
  user.addresses.push(data);

  const added = user.addresses[user.addresses.length - 1];
  if (data.isDefault || isFirst) {
    normalizeDefault(user.addresses, { preferredId: added._id });
  }

  await user.save();
  return user.addresses;
};

export const updateAddress = async (user, addressId, data) => {
  const address = findAddress(user, addressId);
  Object.assign(address, data);

  if (data.isDefault === true) {
    normalizeDefault(user.addresses, { preferredId: address._id });
  } else if (data.isDefault === false) {
    normalizeDefault(user.addresses, { excludeId: address._id });
  }

  await user.save();
  return user.addresses;
};

export const deleteAddress = async (user, addressId) => {
  const address = findAddress(user, addressId);
  const wasDefault = address.isDefault;

  user.addresses.pull({ _id: address._id });
  if (wasDefault) {
    normalizeDefault(user.addresses);
  }

  await user.save();
  return user.addresses;
};
