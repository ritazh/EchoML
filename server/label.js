const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const co = require('co');

const LabelSchema = new Schema({
  begin: { type: Number, default: 0, required: true },
  end: { type: Number, default: 0, required: true },
  label: { type: String, required: false },
  docUrl: { type: String, required: true },
});

LabelSchema.pre('save', done => done);

// Model creation
const LabelModel = mongoose.model('Label', LabelSchema);
module.exports = LabelModel;
