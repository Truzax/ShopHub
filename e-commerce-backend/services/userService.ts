import User from '../models/User';

export class UserService {
  static async getUsers(queryParams: any) {
    const page = parseInt(queryParams.page as string, 10) || 1;
    const limit = parseInt(queryParams.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -refreshTokens -resetPasswordToken')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    return {
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    };
  }

  static async getProfile(user: any) {
    if (!user) throw { status: 401, message: 'Not authenticated' };
    return user;
  }

  static async updateProfile(user: any, data: any) {
    if (!user) throw { status: 401, message: 'Not authenticated' };

    const { name, phone, address } = data;

    const foundUser = await User.findById(user._id);
    if (!foundUser) throw { status: 404, message: 'User not found' };

    if (name) foundUser.name = name;
    if (phone) (foundUser as any).phone = phone;
    if (address) (foundUser as any).address = address;

    await foundUser.save();

    const updatedUser = foundUser.toObject();
    delete (updatedUser as any).password;
    delete (updatedUser as any).refreshTokens;
    delete (updatedUser as any).resetPasswordToken;

    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    };
  }
}
