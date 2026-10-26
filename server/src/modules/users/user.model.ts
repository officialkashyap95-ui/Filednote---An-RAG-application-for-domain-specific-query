
import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Email verification status
    emailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },

    // Signup/login verification code
    verificationCodeHash: {
      type: String,
      select: false,
    },

    verificationCodeExpiresAt: {
      type: Date,
      select: false,
    },

    verificationAttempts: {
      type: Number,
      default: 0,
      required: true,
      select: false,
    },

    // Password-reset OTP — kept separate from login verification
    passwordResetCodeHash: {
      type: String,
      select: false,
    },

    passwordResetCodeExpiresAt: {
      type: Date,
      select: false,
    },

    passwordResetAttempts: {
      type: Number,
      default: 0,
      required: true,
      select: false,
    },

    // Short-lived token issued after a valid reset OTP
    passwordResetTokenHash: {
      type: String,
      select: false,
    },

    passwordResetTokenExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type UserRecord = InferSchemaType<typeof userSchema>;

export const User =
  mongoose.models.User ?? mongoose.model("User", userSchema);
