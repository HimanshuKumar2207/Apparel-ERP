import { Schema } from 'mongoose';

/** Adds soft-delete + createdBy/updatedBy and a safe toJSON to a schema. */
export function basePlugin(schema, { hide = [] } = {}) {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  });
  schema.set('toJSON', {
    transform: (_doc, ret) => {
      delete ret.__v;
      delete ret.isDeleted;
      for (const path of hide) {
        const parts = path.split('.');
        let o = ret;
        for (let i = 0; i < parts.length - 1 && o; i++) o = o[parts[i]];
        if (o) delete o[parts.at(-1)];
      }
      return ret;
    },
  });
}
