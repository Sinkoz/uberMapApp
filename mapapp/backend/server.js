// server.js

// first we import our dependencies…
import express from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import { getSecret } from '../config';
import EFMSchema from './models/efmschema.js';
import Readings from './models/readings.js';
import TreeStruct from './models/treestruct.js';
import TreeNode from './models/treenode.js';

// and create our instances
const app = express();
const router = express.Router();

// set our port to either a predetermined port number if you have set it up, or 3001
const API_PORT = process.env.API_PORT || 3001;


//dbconfig - set your UrI in ../config.js
mongoose.connect(getSecret('devDbUri'));
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// now we should configure the API to use bodyParser and look for JSON data in the request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', getSecret('devAppUri'));

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// now we can set the route path & initialize the API
router.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

router.get('/efmschema', (req, res) => {
  EFMSchema.find((err, dataObj) => {
    if (err) return res.json({ success: false, error:err});
    return res.json({ success: true, data: dataObj });
  });
});

router.post('/efmschema', (req,res) => {
   const data = EFMSchema();
   const { label,
   location,
   description,
   CSIGclass, 
   CSIGMetaURL,
   field,
   readings
  } = req.body;
  data.label = label;
  data.location = location;
  data.description = description; 
  data.CSIGclass = CSIGclass;
  data.CSIGMetaURL = CSIGMetaURL;
  data.field = field;
  data.readings = readings;
  
  var treestruct = TreeStruct();
  treestruct.label = data.CSIGclass;
  treestruct.value = data.CSIGclass;
  for (var i=0; i<data.field.length; i++){
    if(data.field[i].name != "ts"){
      var node = TreeNode();
      node.label = data.field[i].label;
      node.value = data.field[i].name;
      treestruct.children.push(node);
    }
  }

  EFMSchema.exists(data, function(message,status){
    if(status){
	return res.json({ success:false, error:message });
    } else{
      data.save(err => {
        if (err) return res.json({success: false, error: err});
        TreeStruct.exists(data.CSIGclass, function(message, status){
          if(!status){
            treestruct.save(err => {
      	      if (err) return res.json({success: false, error: err});
            });
	  }
        });
      });
      return res.json({ success:true, token: data._id });
    }
  });
});

router.get('/efmreadings', (req, res) => {
  Readings.find((err, dataObj) => {
    if (err) return res.json({ success: false, error:err});
    return res.json({ success: true, data: dataObj });
  });
});

router.post('/efmreadings', (req,res) => {
  const reading = Readings();
  const { label,
  location,
  CSIGclass,
  CSIGMetaURL,
  token,
  readings
  } = req.body;
  reading.label = label;
  reading.CSIGclass = CSIGclass;
  reading.CSIGMetaURL = CSIGMetaURL;
  reading.location = location;
  reading.token = token;
  reading.readings = readings;

  EFMSchema.findOneAndUpdate({ "_id" : reading.token},{$push: {readings: reading.readings}},  (err, dataObj) => {
	if (err) return res.json({success: false, error: err});
  	
	if(reading.CSIGMetaURL == "" || reading.CSIGMetaURL == null){
		reading.CSIGMetaURL = dataObj.CSIGMetaURL;
	}

	reading.save(err => {
    	if (err) return res.json({success: false, error: err});
    	return res.json({ success: true, object: reading});
  	});
  });
});

router.get('/gettreestruct', (req,res) => {
  TreeStruct.find({}, {'_id':0,'__v':0}, function (err, dataObj) {
    if (err) return res.json({ success: false, error: err});
    return res.json({ success: true, data: dataObj });
  })
});

router.get('/getlatestreadings', (req,res) => {
  Readings.aggregate([ 
    { $sort: { "updatedAt": -1 }}, 
    { $group: {
      _id : {
	"CSIGclass": "$CSIGclass",
	"location": "$location"
      },
      readings: {$first: "$readings"},
      CSIGMetaURL: {$first: "$CSIGMetaURL"}
      }
    }
  ], function(err, dataObj){
	if (err) return res.json({ success: false, error: err});	
	return res.json({ success: true, data: dataObj});
  });
});


// Use our router configuration when we call /api
app.use('/api', router);

app.listen(API_PORT, () => console.log(`Listening on port ${API_PORT}`));
