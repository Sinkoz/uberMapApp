// model/schema.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create new instance of the mongoose.schema. the schema takes an
// object that shows the shape of your database entries.
const DataSchema = new Schema({
  pickup_datetime: String,
  dropoff_datetime: String,
  passenger_count: Number,
  trip_distance: Number,
  pickup_longitude: Number,
  pickup_latitude: Number,
  dropoff_longitude: Number,
  dropoff_latitude: Number,
  fare_amount: Number,
  tip_amount: Number,
  total_amount: Number,
}, { timestamps: true });

// export our module to use in server.js
export default mongoose.model('Data', DataSchema);
