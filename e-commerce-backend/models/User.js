const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

const RefreshTokenSchema = new mongoose.Schema({
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    refreshTokens: [RefreshTokenSchema]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare candidate password with stored hash
UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Add a refresh token (store hashed)
UserSchema.methods.addRefreshToken = async function (token) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    this.refreshTokens.push({ token: hashed });
    await this.save();
    return hashed;
};

// Remove a refresh token
UserSchema.methods.removeRefreshToken = async function (token) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== hashed);
    await this.save();
};

// Check if refresh token exists
UserSchema.methods.hasRefreshToken = function (token) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    return this.refreshTokens.some(rt => rt.token === hashed);
};

module.exports = mongoose.model('User', UserSchema);