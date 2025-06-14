const User = require('../models/userModel');

// Get all users 
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Update user role or status 
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    // If user is deactivated, send 403 to force logout
    if (role === 'deactivated') {
      return res.status(403).json({ message: 'User deactivated' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error while updating user' });
  }
};
//update user details
const updateUserDetails = async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.status(200).json({ message: 'User details updated successfully', user });
  }
  catch (err) {
    console.error('Error updating user details:', err);
    res.status(500).json({ message: 'Server error while updating user details' });
  }
};


// Send an email to user
const sendEmailToUser = async (req, res) => {
  const { email, subject, message } = req.body;

  try {
    // Example using nodemailer can go here (or skip for now)
    console.log(`Send email to ${email}: ${subject} - ${message}`);
    res.status(200).json({ message: 'Email sent (simulated)' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending email' });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  updateUserDetails,
  sendEmailToUser
};
