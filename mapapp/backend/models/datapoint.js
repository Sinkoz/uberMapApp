// model/schema.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create new instance of the mongoose.schema. the schema takes an
// object that shows the shape of your database entries.
const DataPoint = new Schema({
  longitude: Number,
  latitude: Number,
  value: Number,
  category: String,
  percentage: Number,
  location: String

}, { timestamps: true });

// export our module to use in server.js
export default mongoose.model('DataPoint', DataPoint);
