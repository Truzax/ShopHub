import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error('MONGO_URI not defined in environment');
  }
  await mongoose.connect(MONGO_URI);
  console.log('Mongodb connected!');
};

export default connectDB;
