import crypto from 'crypto';
import User from '../models/usermodel.js';
import Token from '../models/token.js';
import { sendEmail } from '../utils/email.js';
import { APIError, asyncHandler } from '../utils/apiError.js';

/**
 * Helper to construct user response payload (omits sensitive fields like password)
 */
const getCleanUser = (user) => {
  return {
    id: user._id,
    fullname: user.fullname,
    email: user.email,
    phone: user.phone,
    role: user.role,
    addresses: user.addresses,
    createdAt: user.createdAt,
  };
};

/**
 * 1. User Signup
 * POST /api/auth/signup
 */
export const signup = asyncHandler(async (req, res, next) => {
  const { fullname, email, password, phone, addresses } = req.body;

  // Validate required inputs (Mongoose Schema has validators too, but let's fail early)
  if (!fullname || !email || !password) {
    return next(new APIError('Please provide fullname, email, and password.', 400));
  }

  // Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new APIError('An account with this email address already exists.', 400));
  }

  // Create the new user (Password automatically hashed by schema pre-save hook!)
  const user = await User.create({
    fullname,
    email,
    password,
    phone,
    addresses: addresses || [],
  });

  // Generate JWT token
  const token = user.generateAuthToken();

  // Send Welcome Email asynchronously
  try {
    await sendEmail({
      email: user.email,
      subject: 'Welcome to Maya Angelou API! 👋',
      message: `Hello ${user.fullname},\n\nWelcome to Maya Angelou! Your account has been successfully created.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to Maya Angelou! 🎉</h2>
          <p>Hello <strong>${user.fullname}</strong>,</p>
          <p>We are absolutely thrilled to welcome you to our community! Your account was registered successfully with the email <code>${user.email}</code>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Account Verified & Active</span>
          </div>
          <p>If you have any questions or feedback, feel free to reply to this email.</p>
          <p style="margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px; font-size: 12px; color: #777777; text-align: center;">
            This is an automated system email. Please do not reply directly.
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('⚠️ Failed to send welcome email:', emailError.message);
    // We don't block registration if welcome email fails, just log it.
  }

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: getCleanUser(user),
  });
});

/**
 * 2. User Signin
 * POST /api/auth/signin
 */
export const signin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !password) {
    return next(new APIError('Please provide both email and password.', 400));
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new APIError('Incorrect email or password.', 401));
  }

  // Compare input password with database hashed password using schema methods
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new APIError('Incorrect email or password.', 401));
  }

  // Generate JWT token
  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    token,
    user: getCleanUser(user),
  });
});

/**
 * 3. User Logout
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res, next) => {
  // Since JWT is stateless, the server does not need to store anything.
  // We simply send a success status, prompting client to destroy token.
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear your token.',
  });
});

/**
 * 4. Forgot Password Flow
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new APIError('Please provide your email address.', 400));
  }

  const user = await User.findOne({ email });
  
  // Security best practice: Do not leak whether the email is registered.
  // Return the same success response regardless.
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If a user exists with this email, a reset token has been dispatched.',
    });
  }

  // Generate unique secure hex token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Save token to DB linked to user
  await Token.create({
    userId: user._id,
    token: resetToken,
    type: 'passwordReset',
  });

  // Dispath reset email via Ethereal fallback or SMTP
  try {
    const port = process.env.PORT || 3000;
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Maya Angelou - Reset Your Password 🔑',
      message: `You requested a password reset. Please use the following link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Reset Your Password 🔑</h2>
          <p>Hello <strong>${user.fullname}</strong>,</p>
          <p>We received a request to reset the password for your account associated with <code>${user.email}</code>.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #555555; word-wrap: break-word;">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p style="margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px; font-size: 11px; color: #777777; text-align: center;">
            This token is valid for 1 hour only.
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('❌ Failed to dispatch password reset email:', emailError.message);
    return next(new APIError('Failed to send reset email. Please try again later.', 500));
  }

  res.status(200).json({
    success: true,
    message: 'If a user exists with this email, a reset token has been dispatched.',
  });
});

/**
 * 5. Reset Password
 * POST /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new APIError('Please provide a new password.', 400));
  }

  if (password.length < 6) {
    return next(new APIError('Password must be at least 6 characters long.', 400));
  }

  // Find valid token in DB
  const tokenDoc = await Token.findOne({ token, type: 'passwordReset' });
  if (!tokenDoc) {
    return next(new APIError('The password reset token is invalid or has expired.', 400));
  }

  // Retrieve user associated with the token
  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    return next(new APIError('User associated with this token no longer exists.', 400));
  }

  // Overwrite password (will be automatically hashed by usermodel pre-save hook!)
  user.password = password;
  await user.save();

  // Delete token so it can't be reused
  await Token.deleteOne({ _id: tokenDoc._id });

  // Optional: Send success email confirmation
  try {
    await sendEmail({
      email: user.email,
      subject: 'Security Alert: Password Changed successfully 🔐',
      message: `Hello ${user.fullname},\n\nThis is to confirm that the password for your account has been changed successfully. If you did not make this change, please contact support immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Password Updated successfully 🔐</h2>
          <p>Hello <strong>${user.fullname}</strong>,</p>
          <p>This is to confirm that your password was successfully changed just now.</p>
          <p style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; font-size: 14px; color: #78350f;">
            <strong>Warning:</strong> If you did not make this change, please contact support immediately to secure your account.
          </p>
          <p>If you initiated this change, no action is needed.</p>
          <p style="margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px; font-size: 12px; color: #777777; text-align: center;">
            This is an automated system security notification.
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('⚠️ Failed to send password change alert email:', emailError.message);
  }

  res.status(200).json({
    success: true,
    message: 'Password has been successfully updated.',
  });
});

/**
 * 6. Get Logged In User Profile (Protected)
 * GET /api/auth/profile
 */
export const getProfile = asyncHandler(async (req, res, next) => {
  // req.user is populated by the `protect` middleware
  res.status(200).json({
    success: true,
    user: getCleanUser(req.user),
  });
});

/**
 * 7. Update User Profile (Protected)
 * PUT /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { fullname, phone, addresses } = req.body;
  const user = req.user; // populated by protect middleware

  if (fullname) user.fullname = fullname;
  if (phone) user.phone = phone;
  if (addresses) user.addresses = addresses;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: getCleanUser(user),
  });
});
