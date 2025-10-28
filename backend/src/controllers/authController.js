const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signup = async (req, res) => {
  console.log("📩 [Signup] Request body:", req.body);

  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      console.log("⚠️ Missing fields during signup");
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    console.log("🔍 Checking if user already exists:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User already registered:", email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    console.log("🔑 Hashing password for:", email);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({ name, email, passwordHash });
    await newUser.save();
    console.log("✅ New user saved:", newUser._id);

    // Generate JWT token
    console.log("🪪 Generating JWT for user:", newUser.email);
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    console.log("✅ Signup successful for:", newUser.email);
    res.status(201).json({
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
      message: 'User created successfully'
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};


const login = async (req, res) => {
  console.log("📩 [Login] Request body:", req.body);

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.log("⚠️ Missing fields during login");
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find user
    console.log("🔍 Finding user:", email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    console.log("🔐 Comparing passwords for:", email);
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log("❌ Invalid credentials for:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT
    console.log("🪪 Generating JWT for:", email);
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    console.log("✅ Login successful for:", email);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signup, login };
