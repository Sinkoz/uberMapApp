import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import MapGL from 'react-map-gl';
import DeckGLOverlay from './deckgl-overlay';
import {
  LayerControls,
  HEXAGON_CONTROLS,
  SCATTERPLOT_CONTROLS
} from './layer-controls';
import {tooltipStyle} from './style';
import 'whatwg-fetch';
import DropdownTreeSelect from 'react-dropdown-tree-select';
import {COLORS} from './colors';
import { getSecret } from '../config';

const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v9';
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2lua296IiwiYSI6ImNqaTUyZWY3MTBjY3MzcW1rM2hqYjRkbHoifQ.DqK60GCeJJCrZg2s6t8FTw'  // eslint-disable-line

const uri = getSecret('devServerUri');

if (!MAPBOX_TOKEN) {
  alert('The mapbox token is not defined. Please export it in the terminal where you typed "npm start"')
}

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      // add settings
      settings: {
        ...Object.keys(SCATTERPLOT_CONTROLS).reduce((accu, key) => ({
          ...accu,
          [key]: SCATTERPLOT_CONTROLS[key].value
        }), {}),

        ...Object.keys(HEXAGON_CONTROLS).reduce((accu, key) => ({
          ...accu,
          [key]: HEXAGON_CONTROLS[key].value
      	}), {}),
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        longitude: 17,
        latitude: 26,
        zoom: 1,
        maxZoom: 16
      },
      points: [],
      // hoverInfo
      x: 0,
      y: 0,
      hoveredObject: null,
      status: 'LOADING',
      treedata: [],
      readings: [],
      filters: [],
      counter: 0
    };
    this.pollInterval = null;
    this._getData();
    this._resize = this._resize.bind(this);
    this._getTreeStruct();
  }


  _onViewportChange(viewport) {
    this.setState({
      viewport: {...this.state.viewport, ...viewport}
    });
  }

  componentDidMount() {
    this._getTreeStruct();
    if (!this.pollInterval){
	this.pollInterval = setInterval(this._getData.bind(this), 60000);
    }
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  componentWillUnmount() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = null;
    window.removeEventListener('resize', this._resize);
  }

  _updateLayerSettings(settings) {
    this.setState({settings});
  }

  _onHover({x, y, object}) {
    this.setState({x, y, hoveredObject: object});
  }
 
  _resize() {
    this._onViewportChange({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  _onChange(currentNode,selectedNodes){
	const newData = this.state.treedata;
	this.setState({ filters: selectedNodes });
	if (currentNode._depth == 0){
		var index = Number(currentNode.path);
		var parent = newData[index];
		parent.checked = !parent.checked;
		for (var i = 0; i< parent.children.length; i++){
			parent.children[i].checked = parent.checked;
		}
	}
	else {
		var id = currentNode._id;
		var indices = id.split("-");
		var index = indices[0];
		var childIndex = indices[1];
		newData[index].children[childIndex].checked = !newData[index].children[childIndex].checked;
	}
	this._filterData();
  }

  _filterData(){
    const data = this.state.readings;
    const filters = this.state.filters;
    var dict = this._filterMapper(filters, this.state.treedata);
    this.setState({ status: 'LOADED' });
    const preProcPoints = data.reduce((accu, curr) => {
      for (var i=0; i<filters.length; i++){
	if (filters[i]._depth == 0){
	  if (curr.class == filters[i].value){
		var key = curr.class + '/' + curr.field;
		var colorIndex = dict[key] % COLORS.length;
		curr.color = COLORS[colorIndex];
		accu.push(curr);
	  }
	}
	else{
	  var parentIndex = Number(filters[i]._parent);
	  var parentLabel = this.state.treedata[parentIndex].label;
	  var childLabel = filters[i].value; 		
	  if (curr.class == parentLabel && curr.field == childLabel){
	    var key = curr.class + '/' + curr.field;
	    var colorIndex = dict[key] % COLORS.length;
	    curr.color = COLORS[colorIndex];
	    accu.push(curr);
	  }
	}
      }
      return accu;
    }, []);
    
    var array = [];
    for (var i=0; i<preProcPoints.length; i++){
	array.push(preProcPoints[i].value);
    }
    array = this._rescale(array);
    var points = [];
    for (var i=0; i<preProcPoints.length; i++){
	var point = preProcPoints[i];
	point.radius = array[i];
	points.push(point);
    }
    console.log(points);

    this.setState({
	points,
	status: 'READY'
    });
  }

  _onNodeToggle(currentNode){
	let newData = this.state.treedata;
	var index = currentNode.path;
	newData[index].expanded = !newData[index].expanded;
  }

  _getData(){
    fetch(uri + '/api/getlatestreadings/')
	.then(data => data.json())
	.then((res) => {
		var counter = 0;
		this.setState({ counter });
		if(!res.success) this.setState({ error: res.error});
		else {
			var resObj = res.data;
			console.log(resObj);
/*
			const readings = resObj.reduce((accu, curr) => {
				var keys = Object.keys(curr.readings[0]);
				for (var i=0; i<keys.length;++i){
					if (keys[i] != "ts"){
						accu.push({
							position: this._geocode(curr._id.location),
							value: keys[i],curr.readings[0][keys[i]],
							class: curr._id.CSIGclass,
							field: keys[i],
							color: []
						});
					}
				};
				return accu;
			}, []);
			this.setState({
				readings,
				status: 'READY'
			});
			this._filterData();
*/
			this._iterateReadings(resObj);
		}
	});
  }

  _iterateReadings(data){
	var counter = this.state.counter;
	var timer = setInterval(function(){
		const readings = data.reduce((accu,curr) =>{
			var keys = Object.keys(curr.readings[counter]);
			for (var i=0;i<keys.length;++i){
				if (keys[i] != "ts"){
					accu.push({
						position: this._geocode(curr._id.location),
						value: curr.readings[counter][keys[i]],
						class: curr._id.CSIGclass,
						field: keys[i],	
						color: [],
						radius: 0,
					});
				}

			};			
			return accu;
		},[]);
		this.setState({
			readings,
			status: 'READY'
		});
		this._filterData();
		counter++;
		this.setState({ counter });
		if(this.state.counter == data[0].readings.length){
			counter = 0;
			this.setState({ counter });
			clearInterval(timer);
		}
	}.bind(this),5000);
  }

  _getTreeStruct() {
    fetch('http://localhost:3001/api/gettreestruct')
	.then(data => data.json())
	.then((res) =>{
		if(!res.success) this.setState({ error: res.error});
		else {
			const treedata = res.data;
			this.setState({treedata , status: 'READY'});
			this._assignObjectPaths(this.state.treedata);
		};
	});
  };


  _assignObjectPaths(obj, stack) {
    Object.keys(obj).forEach(k => {
      const node = obj[k];
      if (typeof node === "object") {
        node.path = stack ? `${stack}.${k}` : k;
	node.checked = false;
	node.expanded = false;
        this._assignObjectPaths(node, node.path);
      }
    });
  };

  _geocode(location){
	switch(location){
		case "Sydney":
			return [151.2093, -33.8688]
		case "Japan":
			return [138.2529,36.2048]
		case "Singapore":
			return [103.8198,1.3521]
		case "Toronto":
			return [-79.3832,43.6532]
	}
  }

  _normalizer(category, value){
	switch(category){
		case "disk_free":
			return value/1000;
		case "memory_free":
			return value/1000;
		default:
			return value*10;	

	}
  }

  _rescale(array){
	console.log(array);
	var length = array.length;
	var mediumIndex = Math.floor(length/2);
	var middleElement = array[mediumIndex];
	
	for (var i=0; i<length; i++){
		var element = array[i]
		if (element > middleElement){
			while(element > middleElement*10){
				element /= 10;
			}	
		} else {
			while(middleElement > element*10)
				element *= 10;
		}
		console.log(element);
		element = element *10;
		element = element / middleElement;
		array[i] = element;
	}
	return array;
  }


  _filterMapper(filters, treedata){
    var mappedFilter = {};
    
    for (var i = 0, counter = 0; i < filters.length; i++){
	if (filters[i]._depth == 0){
	  var index = Number(filters[i].path);
	  var parent = treedata[index];
          var parentLabel = parent.value;
	  for (var j = 0; j < parent.children.length; j++){
	    var key = parentLabel + '/' + parent.children[j].value;
	    mappedFilter[key] = counter;
	    counter++;
	  }
	} else{
	  var parentIndex = Number(filters[i]._parent);
	  var parentLabel = treedata[parentIndex].value;
	  var key = parentLabel + '/' + filters[i].value
	  mappedFilter[key] = counter;
	  counter++;
        }
    }
    return mappedFilter;

  }


  render() {
    return (
      <div>
        {this.state.hoveredObject &&
          <div style={{
            ...tooltipStyle,
            transform: `translate(${this.state.x}px, ${this.state.y}px)`
          }}>
            <div>{JSON.stringify(this.state.hoveredObject)}</div>
          </div>}
	<DropdownTreeSelect data={this.state.treedata} onChange={(currentNode,selectedNodes) => this._onChange(currentNode,selectedNodes)} onNodeToggle={(currentNode) => this._onNodeToggle(currentNode)}/>
        <LayerControls
          settings={this.state.settings}
          propTypes={HEXAGON_CONTROLS}
          onChange={settings => this._updateLayerSettings(settings)}/>
	<MapGL
          {...this.state.viewport}
          mapStyle={MAPBOX_STYLE}
	  onViewportChange={viewport => this._onViewportChange(viewport)}
          // This is needed to use mapbox styles
          mapboxApiAccessToken={MAPBOX_TOKEN}>
	  <DeckGLOverlay
            viewport={this.state.viewport}
	    {...this.state.settings}
            data={this.state.points} 
	    onHover={hover => this._onHover(hover)}
   	    {...this.state.settings} />
        </MapGL>
      </div>
    );
  }
}
