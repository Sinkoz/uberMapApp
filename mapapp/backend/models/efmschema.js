// model/efmschema.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create new instance of the mongoose.schema. the schema takes an
// object that shows the shape of your database entries.
const EFMSchema = new Schema({
  "label" : String,
  "location" : { type: String, enum : ['sydney', 'Toronto', 'Singapore', 'Japan'], default: 'Toronto'},
  "description" : String,
  "CSIGclass": String,
  "CSIGMetalURL": String,
  "field" : { type: Array , "default" : [] },
  "readings" : { type: Array, "default" : [] }
}, { timestamps: true });

EFMSchema.statics.exists = function(data, callback){
  this.find({ "label": data.label, "location": data.location}).exec(function(err,docs){
    if (docs.length){
	callback('Location-Label pair already exists', true);
    } else{
      callback('Created!', false);
    }
  });
}

export default mongoose.model('EFMSchema', EFMSchema);
