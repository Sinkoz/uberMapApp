// model/readings.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Readings = new Schema({
  "label" : String,
  "location" : { type: String, enum : ['sydney', 'toronto', 'singapore', 'japan'] },
  "readings" : { type: Array, "default": [] }
}, { timestamps: true});

export default mongoose.model('Readings', Readings);
