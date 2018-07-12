import React, {Component} from 'react';
import MapGL from 'react-map-gl';
import DeckGLOverlay from './deckgl-overlay';
import {
  LayerControls,
  HEXAGON_CONTROLS,
  SCATTERPLOT_CONTROLS
} from './layer-controls';
import {tooltipStyle} from './style';
import 'whatwg-fetch';

const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v9';
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2lua296IiwiYSI6ImNqaTUyZWY3MTBjY3MzcW1rM2hqYjRkbHoifQ.DqK60GCeJJCrZg2s6t8FTw'  // eslint-disable-line

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
      status: 'LOADING'
    };
    this._resize = this._resize.bind(this);
  }

  _onViewportChange(viewport) {
    this.setState({
      viewport: {...this.state.viewport, ...viewport}
    });
  }

  componentDidMount() {
    this._processData();
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resize);
  }

  _updateLayerSettings(settings) {
    console.log(settings);
    this.setState({settings});
    this._processData();
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

  _processData() {
    fetch('http://localhost:3001/api/datapoints/')
        .then(data => data.json())
        .then((res) => {
                console.log(res.data);
                if (!res.success) this.setState({ error : res.error });
                else
    { 
      var myObj = res.data;
      delete myObj._id;
      this.setState({status: 'LOADED'}); 
      const points = myObj.reduce((accu, curr) => {
        if (this.state.settings[curr.category]) {
        accu.push({ 
          position: [Number(curr.longitude), Number(curr.latitude)],
          value: Number(curr.value),
          category: curr.category
        });
        }
        return accu;
      }, []);
      this.setState({
        points, 
        status: 'READY'
      });
    console.log(this.state.points);
    console.log(points);
    }
  });   
  }

/*
  _processData(){
    fetch('http://localhost:3001/api/datareadings/')
	.then(data => data.json())
	.then((res) => {
		console.log(res.data);
		if(!res.success) this.setState({ error: res.error});
		else {
			var myObj = res.data;
		}
	}
  }
*/
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
