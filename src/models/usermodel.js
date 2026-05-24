import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, "Please provide your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: { 
    type: String, 
    required: [true, "Please provide a password"],
    minlength: [6, "Password must be at least 6 characters long"]
  }, 
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

// Pre-save hook: Automatically hash password before saving
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare candidate password with the hashed password in db
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  const secret = process.env.JWT_SECRET || 'yourSuperSecretKey';
  const expires = process.env.JWT_EXPIRES_IN || '1h';
  
  return jwt.sign(
    { id: this._id, role: this.role },
    secret,
    { expiresIn: expires }
  );
};

export default mongoose.model("User", userSchema);