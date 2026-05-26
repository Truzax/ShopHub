import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IMessage {
    role: 'user' | 'model';
    content: string;
}

export interface IAiConversation extends Document {
    userId?: IUser['_id'];
    sessionId?: string;
    messages: IMessage[];
    updatedAt: Date;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        role: { type: String, enum: ['user', 'model'], required: true },
        content: { type: String, required: true },
    },
    { _id: false }
);

const AiConversationSchema = new Schema<IAiConversation>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        sessionId: { type: String }, // For guest users
        messages: { type: [MessageSchema], default: [] },
    },
    { timestamps: true }
);

// Indexes to fetch conversations quickly
AiConversationSchema.index({ userId: 1 });
AiConversationSchema.index({ sessionId: 1 });

export default mongoose.model<IAiConversation>('AiConversation', AiConversationSchema);
