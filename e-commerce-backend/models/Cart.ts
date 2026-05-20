import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IProduct } from './Product';

export interface ICartItem {
    product: IProduct['_id'];
    quantity: number;
}

export interface ICart extends Document {
    user: IUser['_id'];
    items: ICartItem[];
}

const CartItemSchema = new Schema<ICartItem>({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const CartSchema = new Schema<ICart>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        items: [CartItemSchema],
    },
    { timestamps: true }
);

export default mongoose.model<ICart>('Cart', CartSchema);
