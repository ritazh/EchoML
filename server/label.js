const mongoose = require('mongoose');

const LabelSchema = new mongoose.Schema({
  start: { type: Number, default: 0, required: true },
  end: { type: Number, default: 0, required: true },
  label: { type: String, required: false },
  docUrl: { type: String, required: true },
});

LabelSchema.pre('save', done => done);

// Model creation
const LabelModel = mongoose.model('Label', LabelSchema);
module.exports = LabelModel;
