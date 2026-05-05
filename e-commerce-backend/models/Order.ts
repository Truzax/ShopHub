import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IProduct } from './Product';

export interface IOrderItem {
    product: IProduct['_id'];
    quantity: number;
    price: number;
}

export interface IOrder extends Document {
    orderNumber: string;
    user: IUser['_id'];
    products: IOrderItem[];
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    date: Date;
    stockUpdated: boolean;
}

const OrderItemSchema = new Schema<IOrderItem>({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
});

const OrderSchema = new Schema<IOrder>(
    {
        orderNumber: { type: String, unique: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        products: { type: [OrderItemSchema], required: true },
        total: { type: Number, required: true, min: 0 },
        status: { 
            type: String, 
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
            default: 'pending' 
        },
        date: { type: Date, default: Date.now },
        stockUpdated: { type: Boolean, default: false },
    },
    { timestamps: true }
);

OrderSchema.pre('save', async function() {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderNumber = `ORD-${year}${month}${day}-${random}`;
    }
});

    // Add indexes for analytics aggregation performance
    OrderSchema.index({ date: 1, status: 1 });
    OrderSchema.index({ 'products.product': 1 });
    OrderSchema.index({ status: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
