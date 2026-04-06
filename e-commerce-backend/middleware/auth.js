const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || '0c4d2862e59353ceda3e54136364b342a4e32615b9ed8600dc2019f593f04fa6d900787635cbc7d89d0d0d16ad6aca9479d553c4167ce6d284aef5de52ddcd0a');
    req.user = await User.findById(payload.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
