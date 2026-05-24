import assert from 'assert';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/usermodel.js';
import Token from './src/models/token.js';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api/auth';
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'Password123!';
let jwtToken = '';
let resetToken = '';

const log = (step, msg) => console.log(`\x1b[36m[STEP ${step}]\x1b[0m ${msg}`);
const logSuccess = (msg) => console.log(`\x1b[32m  ✔ ${msg}\x1b[0m`);
const logFail = (msg) => console.error(`\x1b[31m  ✘ ${msg}\x1b[0m`);

async function runTests() {
  console.log('\n🚀 Starting Robust Backend API verification suite...\n');

  try {
    // -------------------------------------------------------------
    // STEP 1: Signup
    // -------------------------------------------------------------
    log(1, 'Testing User Registration (Signup)...');
    const signupRes = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullname: 'Peter Test Angelou',
        email: testEmail,
        password: testPassword,
        phone: '+1234567890',
        addresses: [
          {
            street: '123 Poetry Lane',
            city: 'St. Louis',
            state: 'MO',
            postalCode: '63101',
            country: 'USA'
          }
        ]
      })
    });
    const signupData = await signupRes.json();
    assert.strictEqual(signupRes.status, 201, 'Signup should return 201 status');
    assert.strictEqual(signupData.success, true, 'Signup response success should be true');
    assert.ok(signupData.token, 'Signup response should include JWT token');
    assert.strictEqual(signupData.user.email, testEmail, 'Signup email should match input');
    jwtToken = signupData.token;
    logSuccess('User registration completed successfully.');

    // -------------------------------------------------------------
    // STEP 2: Duplicate Signup
    // -------------------------------------------------------------
    log(2, 'Testing Duplicate Registration Prevention...');
    const dupRes = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullname: 'Duplicate User',
        email: testEmail,
        password: 'AnotherPassword123'
      })
    });
    const dupData = await dupRes.json();
    assert.strictEqual(dupRes.status, 400, 'Duplicate signup should return 400 status');
    assert.strictEqual(dupData.success, false, 'Duplicate signup success should be false');
    assert.ok(dupData.message.includes('already exists'), 'Should explain that the user already exists');
    logSuccess('Duplicate email registration was successfully blocked.');

    // -------------------------------------------------------------
    // STEP 3: Signin (Success)
    // -------------------------------------------------------------
    log(3, 'Testing Signin with correct credentials...');
    const signinRes = await fetch(`${BASE_URL}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const signinData = await signinRes.json();
    assert.strictEqual(signinRes.status, 200, 'Signin should return 200 status');
    assert.strictEqual(signinData.success, true, 'Signin success should be true');
    assert.ok(signinData.token, 'Signin should return token');
    logSuccess('User signin completed successfully.');

    // -------------------------------------------------------------
    // STEP 4: Signin (Failure)
    // -------------------------------------------------------------
    log(4, 'Testing Signin with incorrect credentials...');
    const failSigninRes = await fetch(`${BASE_URL}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword'
      })
    });
    const failSigninData = await failSigninRes.json();
    assert.strictEqual(failSigninRes.status, 401, 'Invalid signin should return 401 status');
    assert.strictEqual(failSigninData.success, false, 'Invalid signin success should be false');
    logSuccess('Incorrect password signin was successfully blocked.');

    // -------------------------------------------------------------
    // STEP 5: Get Profile (Protected)
    // -------------------------------------------------------------
    log(5, 'Testing GET /profile using valid JWT...');
    const profileRes = await fetch(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    const profileData = await profileRes.json();
    assert.strictEqual(profileRes.status, 200, 'Profile retrieval should return 200 status');
    assert.strictEqual(profileData.success, true, 'Profile success should be true');
    assert.strictEqual(profileData.user.fullname, 'Peter Test Angelou', 'Profile fullname should match registration');
    logSuccess('User profile retrieved successfully.');

    // -------------------------------------------------------------
    // STEP 6: Update Profile (Protected)
    // -------------------------------------------------------------
    log(6, 'Testing PUT /profile using valid JWT...');
    const updateRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        fullname: 'Peter The Great Angelou',
        phone: '+9876543210'
      })
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200, 'Profile update should return 200 status');
    assert.strictEqual(updateData.success, true, 'Profile update success should be true');
    assert.strictEqual(updateData.user.fullname, 'Peter The Great Angelou', 'Updated fullname should be visible in response');
    assert.strictEqual(updateData.user.phone, '+9876543210', 'Updated phone should be visible in response');
    logSuccess('User profile updated successfully.');

    // -------------------------------------------------------------
    // STEP 7: Forgot Password
    // -------------------------------------------------------------
    log(7, 'Testing Request Password Reset (Forgot Password)...');
    const forgotRes = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotData = await forgotRes.json();
    assert.strictEqual(forgotRes.status, 200, 'Forgot password request should return 200');
    assert.strictEqual(forgotData.success, true, 'Forgot password response success should be true');
    logSuccess('Password reset request dispatched successfully.');

    log(7.5, 'Retrieving reset token from MongoDB...');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    
    const tokenDoc = await mongoose.connection.db.collection('tokens').findOne({ type: 'passwordReset' });
    assert.ok(tokenDoc, 'A password reset token document should exist in the collection');
    resetToken = tokenDoc.token;
    logSuccess(`Retrieved reset token from DB: ${resetToken}`);

    // -------------------------------------------------------------
    // STEP 8: Reset Password
    // -------------------------------------------------------------
    log(8, 'Testing Reset Password using token...');
    const newPassword = 'NewSecretPassword456!';
    const resetRes = await fetch(`${BASE_URL}/reset-password/${resetToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    });
    const resetData = await resetRes.json();
    assert.strictEqual(resetRes.status, 200, 'Reset password should return 200');
    assert.strictEqual(resetData.success, true, 'Reset password success should be true');
    logSuccess('Password reset token verified and updated successfully.');

    // -------------------------------------------------------------
    // STEP 9: Verify Signin with New Password
    // -------------------------------------------------------------
    log(9, 'Testing Signin with new password...');
    const newSigninRes = await fetch(`${BASE_URL}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword
      })
    });
    const newSigninData = await newSigninRes.json();
    assert.strictEqual(newSigninRes.status, 200, 'Signin with new password should return 200');
    assert.strictEqual(newSigninData.success, true, 'Signin with new password success should be true');
    logSuccess('Successfully logged in using the newly updated password.');

    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    log(10, 'Cleaning up test data from Database...');
    const testUser = await User.findOne({ email: testEmail });
    if (testUser) {
      await Token.deleteMany({ userId: testUser._id });
      await User.deleteOne({ _id: testUser._id });
    }
    logSuccess('Database cleaned up successfully.');

    console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! The backend is robust, secured, and ready. 🎉\n');
    process.exit(0);

  } catch (error) {
    logFail(`Verification suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

runTests();
