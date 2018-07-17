// model/treestruct.js
import mongoose from 'mongoose';
import TreeNode from './treenode.js';

const Schema = mongoose.Schema;

const TreeStruct = new Schema({
  "label" : { type: String, unique: true, dropDups: true},
  "value" : String,
  "children" : [TreeNode.schema] 
});

TreeStruct.statics.exists = function(label,callback){
  this.find({ "label": label}).exec(function(err,docs){
    if (docs.length){
	callback("Structure already exists", true);
    } else {
	callback("Structure doesn't exists", false);
    }
  });
}

export default mongoose.model('TreeStruct', TreeStruct);
