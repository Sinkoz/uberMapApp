// server.js

// first we import our dependencies…
import express from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import { getSecret } from './secrets';
import Data from './models/schema';
import DataPoint from './models/datapoint';
import EFMSchema from './models/efmschema.js';
import Readings from './models/readings.js';

// and create our instances
const app = express();
const router = express.Router();

// set our port to either a predetermined port number if you have set it up, or 3001
const API_PORT = process.env.API_PORT || 3001;


//dbconfig - set your UrI in secrets.js
mongoose.connect(getSecret('dbUri'));
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// now we should configure the API to use bodyParser and look for JSON data in the request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3030');

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


router.get('/data', (req, res) => {
  Data.find((err, dataObj) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: dataObj });
  });
});

router.post('/data', (req, res) => {
  const data = new Data();
  // body parser lets us use the req.body
  const { pickup_datetime,
  dropoff_datetime,
  passenger_count,
  trip_distance,
  pickup_longitude,
  pickup_latitude,
  dropoff_longitude,
  dropoff_latitude,
  fare_amount,
  tip_amount,
  total_amount,
 } = req.body;
  //if (!author || !text) {
    // we should throw an error. we can do this check on the front end
  //  return res.json({
  //    success: false,
  //    error: 'You must provide an author and comment'
  //  });
  //}
  data.pickup_datetime = pickup_datetime;
  data.dropoff_datetime = dropoff_datetime;
  data.passenger_count = passenger_count;
  data.trip_distance = trip_distance;
  data.pickup_longitude = pickup_longitude;
  data.pickup_latitude = pickup_latitude;
  data.dropoff_longitude = dropoff_longitude;
  data.pickup_latitude = pickup_latitude;
  data.fare_amount = fare_amount;
  data.tip_amount = tip_amount;
  data.total_amount = total_amount;
  data.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.get('/datapoints', (req, res) => {
  DataPoint.find((err, dataObj) => {
    if (err) return res.json({ success: false, error:err});
    return res.json({ success: true, data: dataObj });
  });
});

router.post('/datapoints', (req,res) => {
   const data = new DataPoint();
   const { longitude,
   latitude,
   value, 
   category,
   percentage,
   location
  } = req.body;
  data.longitude = longitude;
  data.latitude = latitude;
  data.value = value;
  data.category = category;
  data.percentage = percentage;
  data.location = location;
  data.save(err => {
    if (err) return res.json({success: false, error: err});
    return res.json({ success: true });
  });
});

router.get('/efmreadings', (req, res) => {
  EFMSchema.find((err, dataObj) => {
    if (err) return res.json({ success: false, error:err});
    return res.json({ success: true, data: dataObj });
  });
});

router.post('/efmreadings', (req,res) => {
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
  data.save(err => {
    if (err) return res.json({success: false, error: err});
    console.log(data);
    return res.json({ success: true });
  });
});

router.get('/readings', (req, res) => {
  Readings.find((err, dataObj) => {
    if (err) return res.json({ success: false, error:err});
    return res.json({ success: true, data: dataObj });
  });
});

router.post('/readings', (req,res) => {
  const reading = Readings();
  const { label,
  location,
  readings
  } = req.body;
  reading.label = label;
  reading.location = location;
  reading.readings = readings;

  EFMSchema.updateOne({ "label" : reading.label},{$push: {readings: reading.readings}},  (err, dataObj) => {
	if (err) return res.json({success: false, error: err});
  	
	reading.save(err => {
    	if (err) return res.json({success: false, error: err});
    	return res.json({ success: true });
  	});
  });
  

});

// Use our router configuration when we call /api
app.use('/api', router);

app.listen(API_PORT, () => console.log(`Listening on port ${API_PORT}`));
