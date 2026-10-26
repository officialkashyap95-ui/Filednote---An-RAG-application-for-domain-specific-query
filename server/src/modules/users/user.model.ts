
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

    // SHA-256 hash of the email verification code
    verificationCodeHash: {
      type: String,
      select: false,
    },

    // Expiration time for the verification code
    verificationCodeExpiresAt: {
      type: Date,
      select: false,
    },

    // Number of failed verification attempts
    verificationAttempts: {
      type: Number,
      default: 0,
      required: true,
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
