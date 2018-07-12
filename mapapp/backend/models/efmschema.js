// model/efmschema.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create new instance of the mongoose.schema. the schema takes an
// object that shows the shape of your database entries.
const EFMSchema = new Schema({
  "label" : { type: String, unique: true, dropDups: true},
  "location" : { type: String, enum : ['sydney', 'toronto', 'singapore', 'japan'], default: 'toronto', unique: true, dropDups: true},
  "description" : String,
  "CSIGclass": String,
  "CSIGMetalURL": String,
  "field" : { type: Array , "default" : [] },
  "readings" : { type: Array, "default" : [] }
}, { timestamps: true });

export default mongoose.model('EFMSchema', EFMSchema);
