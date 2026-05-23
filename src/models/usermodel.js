import mongoose from "mongoose";
import bycrypt from "bcrypt";
import e from "express";

const userSchema = new mongoose.Schema({
    fullname:{
        type: String,
        required: [true, "Please provide your name"],
        trim: true,
    },
   email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
},
password: { type: String, required: true }, 
  phone: { type: String, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  addresses: [{
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  }],
}, { timestamps: true });

export default mongoose.model("User", userSchema);