import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

interface IRefreshToken {
    token: string;
    createdAt?: Date;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: string;
    refreshTokens: IRefreshToken[];
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    addRefreshToken(token: string): Promise<string>;
    removeRefreshToken(token: string): Promise<void>;
    hasRefreshToken(token: string): boolean;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, default: 'user' },
        refreshTokens: { type: [RefreshTokenSchema], default: [] },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
    },
    { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare candidate password with stored hash
UserSchema.methods.comparePassword = function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Add a refresh token (store hashed)
UserSchema.methods.addRefreshToken = async function (token: string) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    this.refreshTokens.push({ token: hashed });
    await this.save();
    return hashed;
};

// Remove a refresh token
UserSchema.methods.removeRefreshToken = async function (token: string) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    this.refreshTokens = this.refreshTokens.filter((rt: IRefreshToken) => rt.token !== hashed);
    await this.save();
};

// Check if refresh token exists
UserSchema.methods.hasRefreshToken = function (token: string) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    return this.refreshTokens.some((rt: IRefreshToken) => rt.token === hashed);
};

const UserModel = mongoose.model<IUser>('User', UserSchema);
export default UserModel;