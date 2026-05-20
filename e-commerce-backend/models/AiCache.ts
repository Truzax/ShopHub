import mongoose, { Document, Schema } from 'mongoose';

export interface IAiCache extends Document {
    key: string;
    data: any;
    lastDataUpdate: Date;
}

const AiCacheSchema = new Schema<IAiCache>(
    {
        key: { type: String, required: true, unique: true, index: true },
        data: { type: Schema.Types.Mixed, required: true },
        lastDataUpdate: { type: Date, required: true }
    },
    { timestamps: true }
);

export default mongoose.model<IAiCache>('AiCache', AiCacheSchema);
