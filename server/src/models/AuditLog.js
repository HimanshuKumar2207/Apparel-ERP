import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userName: String,
    role: String,
    action: { type: String, required: true, index: true },
    module: { type: String, index: true },
    recordId: String,
    summary: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    ip: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Append-only: block every mutation path.
const blocked = ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'replaceOne'];
auditSchema.pre(blocked, function blockMutations() {
  throw new Error('Audit logs are append-only');
});
auditSchema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });

export const AuditLog = mongoose.model('AuditLog', auditSchema);
