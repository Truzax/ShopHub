const User = require('../models/User');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || '0c4d2862e59353ceda3e54136364b342a4e32615b9ed8600dc2019f593f04fa6d900787635cbc7d89d0d0d16ad6aca9479d553c4167ce6d284aef5de52ddcd0a', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
}

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    // Allow only specific roles and normalize to lowercase
    const allowedRoles = ['user', 'admin'];
    let normalizedRole = 'user';
    if (role && typeof role === 'string') {
      const r = role.toLowerCase();
      if (allowedRoles.includes(r)) normalizedRole = r;
    }

    const user = new User({ name, email, password, role: normalizedRole });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    next(err);
  }
};
