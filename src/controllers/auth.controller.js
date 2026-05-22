// 1. Controller function for creating an account
export const signup = async (req, res) => {
  try {
    // Extract the email and password sent by the user from the request body
    const { email, password } = req.body;

    // VALIDATION: Check if the user forgot to type something
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both an email and a password."
      });
    }

    // VALIDATION: Check if password is too short
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    // For now, let's print it to our terminal console to prove we can read it!
    console.log(`📩 New user registration attempt: Email is ${email}`);

    // Mock response (Next up we will connect a real database!)
    res.status(201).json({
      success: true,
      message: "Account created successfully (Mocked)!",
      userData: {
        email: email
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Controller function for signing in
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both an email and a password."
      });
    }

    console.log(`🔐 Sign-in attempt for email: ${email}`);

    res.status(200).json({
      success: true,
      message: "Sign-in successful (Mocked)!",
      userData: { email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Controller function for logging out
export const logout = async (req, res) => {
  try {
    console.log("🚪 User requested logout");

    res.status(200).json({
      success: true,
      message: "Logged out successfully (Mocked)!"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
