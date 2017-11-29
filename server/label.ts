import * as mongoose from 'mongoose';

const LabelSchema = new mongoose.Schema({
  docUrl: { type: String, required: true },
  end: { type: Number, default: 0, required: true },
  label: { type: String, required: false },
  start: { type: Number, default: 0, required: true },
});

LabelSchema.pre('save', done => done);

// Model creation
export const LabelModel = mongoose.model('Label', LabelSchema);

export interface ILabel {
  start: number;
  end: number;
  label: string;
  docUrl: string;
}
