import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const BCRYPT_ROUNDS = 12;

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40, default: 'Home' },
    recipientName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    street: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    province: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 10 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Optional because Google-only accounts have no local password.
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    // Stored because the password itself is never loaded by default. Lets the profile page hide the password form for Google-only accounts.
    hasPassword: { type: Boolean, default: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.hasPassword = Boolean(this.password);
  if (!this.password) return;
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.googleId;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
