import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IProduct } from './Product';

export interface IOrderItem {
    product: IProduct['_id'];
    quantity: number;
    price: number;
}

export interface IOrder extends Document {
    user: IUser['_id'];
    products: IOrderItem[];
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    date: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
});

const OrderSchema = new Schema<IOrder>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        products: { type: [OrderItemSchema], required: true },
        total: { type: Number, required: true, min: 0 },
        status: { 
            type: String, 
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
            default: 'pending' 
        },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
