const UserModel = require('../models/userModel');

const authController = {
  // POST /api/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'ID and access code are required'
        });
      }

      const user = await UserModel.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Plain text password comparison (matches schema seed data)
      if (password !== user.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Determine role from Admin / Police_Officer tables
      const role = await UserModel.getRole(user.user_id);

      // Return user info (excluding password)
      const { password: _, ...userInfo } = user;

      res.json({
        success: true,
        message: 'Login successful',
        user: { ...userInfo, role }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  },

  // GET /api/user/:id
  async getUser(req, res) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const role = await UserModel.getRole(user.user_id);
      res.json({ success: true, user: { ...user, role } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = authController;
