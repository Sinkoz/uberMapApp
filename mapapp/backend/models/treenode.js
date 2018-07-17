// model/treenode.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const TreeNode = new Schema({
  "label" : String,
  "_id" : false
});

export default mongoose.model('TreeNode', TreeNode);
