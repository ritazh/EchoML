const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const co = require('co');

const LabelSchema = new Schema({
  begin: { type: Number, default: 0, required: true },
  end: { type: Number, default: 0, required: true },
  label: { type: String, required: true },
  updated: { type: Date, default: Date.now },
});

LabelSchema.pre('save', function (done) {
  // only update record when it has been modified (or is new)
  this.updated = new Date();
  return done;
});

// Model creation
mongoose.model('Label', LabelSchema);
