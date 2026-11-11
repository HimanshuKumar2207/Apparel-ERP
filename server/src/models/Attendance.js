import mongoose from 'mongoose';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const attendanceSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
    status: { type: String, enum: ['present', 'absent', 'halfDay', 'leave'], default: 'present' },
    checkIn: Date,
    checkOut: Date,
    note: { type: String, maxlength: 200 },
  },
  { timestamps: true },
);
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.plugin(basePlugin);
export const Attendance = mongoose.model('Attendance', attendanceSchema);
