import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    price: number;
    category: string;
    stock: number;
    description?: {
        short?: string;
        long?: string;
    };
    features?: string[];
    seoKeywords?: string[];
}

const ProductSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        category: { type: String, required: true, trim: true },
        stock: { type: Number, required: true, min: 0 },
        description: {
            short: { type: String },
            long: { type: String }
        },
        features: [{ type: String }],
        seoKeywords: [{ type: String }],
    },
    { timestamps: true }
);

    // Add index for analytics category filtering
    ProductSchema.index({ category: 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
