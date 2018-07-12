'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _react = require('react');

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _autobind = require('../utils/autobind');

var _autobind2 = _interopRequireDefault(_autobind);

var _styleUtils = require('../utils/style-utils');

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _viewportMercatorProject = require('viewport-mercator-project');

var _mapbox = require('../mapbox/mapbox');

var _mapbox2 = _interopRequireDefault(_mapbox);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable max-len */
var TOKEN_DOC_URL = 'https://uber.github.io/react-map-gl/#/Documentation/getting-started/about-mapbox-tokens';
/* eslint-disable max-len */

// Copyright (c) 2015 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
function noop() {}

var propTypes = (0, _assign2.default)({}, _mapbox2.default.propTypes, {
  /** The Mapbox style. A string url or a MapboxGL style Immutable.Map object. */
  mapStyle: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.instanceOf(_immutable2.default.Map)]),
  /** There are known issues with style diffing. As stopgap, add option to prevent style diffing. */
  preventStyleDiffing: _propTypes2.default.bool,
  /** Whether the map is visible */
  visible: _propTypes2.default.bool
});

var defaultProps = (0, _assign2.default)({}, _mapbox2.default.defaultProps, {
  mapStyle: 'mapbox://styles/mapbox/light-v8',
  preventStyleDiffing: false,
  visible: true
});

var childContextTypes = {
  viewport: _propTypes2.default.instanceOf(_viewportMercatorProject.PerspectiveMercatorViewport)
};

var StaticMap = function (_PureComponent) {
  (0, _inherits3.default)(StaticMap, _PureComponent);
  (0, _createClass3.default)(StaticMap, null, [{
    key: 'supported',
    value: function supported() {
      return _mapbox2.default && _mapbox2.default.supported();
    }
  }]);

  function StaticMap(props) {
    (0, _classCallCheck3.default)(this, StaticMap);

    var _this = (0, _possibleConstructorReturn3.default)(this, (StaticMap.__proto__ || (0, _getPrototypeOf2.default)(StaticMap)).call(this, props));

    _this._queryParams = {};
    if (!StaticMap.supported()) {
      _this.componentDidMount = noop;
      _this.componentWillReceiveProps = noop;
      _this.componentDidUpdate = noop;
    }
    _this.state = {};
    (0, _autobind2.default)(_this);
    return _this;
  }

  (0, _createClass3.default)(StaticMap, [{
    key: 'getChildContext',
    value: function getChildContext() {
      return {
        viewport: new _viewportMercatorProject.PerspectiveMercatorViewport(this.props)
      };
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this._mapbox = new _mapbox2.default((0, _assign2.default)({}, this.props, {
        container: this._mapboxMap,
        style: undefined
      }));
      this._map = this._mapbox.getMap();
      this._updateMapStyle({}, this.props);
      this.forceUpdate(); // Make sure we rerender after mounting
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(newProps) {
      this._mapbox.setProps(newProps);
      this._updateMapStyle(this.props, newProps);

      // this._updateMapViewport(this.props, newProps);

      // Save width/height so that we can check them in componentDidUpdate
      this.setState({
        width: this.props.width,
        height: this.props.height
      });
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      // Since Mapbox's map.resize() reads size from DOM
      // we must wait to read size until after render (i.e. here in "didUpdate")
      this._updateMapSize(this.state, this.props);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this._mapbox.finalize();
      this._mapbox = null;
      this._map = null;
    }

    // External apps can access map this way

  }, {
    key: 'getMap',
    value: function getMap() {
      return this._map;
    }

    /** Uses Mapbox's
      * queryRenderedFeatures API to find features at point or in a bounding box.
      * https://www.mapbox.com/mapbox-gl-js/api/#Map#queryRenderedFeatures
      * To query only some of the layers, set the `interactive` property in the
      * layer style to `true`.
      * @param {[Number, Number]|[[Number, Number], [Number, Number]]} geometry -
      *   Point or an array of two points defining the bounding box
      * @param {Object} parameters - query options
      */

  }, {
    key: 'queryRenderedFeatures',
    value: function queryRenderedFeatures(geometry, parameters) {
      var queryParams = parameters || this._queryParams;
      if (queryParams.layers && queryParams.layers.length === 0) {
        return [];
      }
      return this._map.queryRenderedFeatures(geometry, queryParams);
    }

    // Hover and click only query layers whose interactive property is true

  }, {
    key: '_updateQueryParams',
    value: function _updateQueryParams(mapStyle) {
      var interactiveLayerIds = (0, _styleUtils.getInteractiveLayerIds)(mapStyle);
      this._queryParams = { layers: interactiveLayerIds };
    }

    // Note: needs to be called after render (e.g. in componentDidUpdate)

  }, {
    key: '_updateMapSize',
    value: function _updateMapSize(oldProps, newProps) {
      var sizeChanged = oldProps.width !== newProps.width || oldProps.height !== newProps.height;

      if (sizeChanged) {
        this._map.resize();
        // this._callOnChangeViewport(this._map.transform);
      }
    }
  }, {
    key: '_updateMapStyle',
    value: function _updateMapStyle(oldProps, newProps) {
      var mapStyle = newProps.mapStyle;
      var oldMapStyle = oldProps.mapStyle;
      if (mapStyle !== oldMapStyle) {
        if (_immutable2.default.Map.isMap(mapStyle)) {
          if (this.props.preventStyleDiffing) {
            this._map.setStyle(mapStyle.toJS());
          } else {
            (0, _styleUtils.setDiffStyle)(oldMapStyle, mapStyle, this._map);
          }
        } else {
          this._map.setStyle(mapStyle);
        }
        this._updateQueryParams(mapStyle);
      }
    }
  }, {
    key: '_mapboxMapLoaded',
    value: function _mapboxMapLoaded(ref) {
      this._mapboxMap = ref;
    }
  }, {
    key: '_renderNoTokenWarning',
    value: function _renderNoTokenWarning() {
      if (this._mapbox && !this._mapbox.accessToken) {
        var style = {
          position: 'absolute',
          left: 0,
          top: 0
        };
        return (0, _react.createElement)('div', { key: 'warning', id: 'no-token-warning', style: style }, [(0, _react.createElement)('h3', { key: 'header' }, 'No Mapbox access token found'), (0, _react.createElement)('div', { key: 'text' }, 'For information on setting up your basemap, read'), (0, _react.createElement)('a', { key: 'link', href: TOKEN_DOC_URL }, 'Note on Map Tokens')]);
      }

      return null;
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          className = _props.className,
          width = _props.width,
          height = _props.height,
          style = _props.style,
          visible = _props.visible;

      var mapContainerStyle = (0, _assign2.default)({}, style, { width: width, height: height, position: 'relative' });
      var mapStyle = (0, _assign2.default)({}, style, {
        width: width,
        height: height,
        visibility: visible ? 'visible' : 'hidden'
      });
      var overlayContainerStyle = {
        position: 'absolute',
        left: 0,
        top: 0,
        width: width,
        height: height,
        overflow: 'hidden'
      };

      // Note: a static map still handles clicks and hover events
      return (0, _react.createElement)('div', {
        key: 'map-container',
        style: mapContainerStyle,
        children: [(0, _react.createElement)('div', {
          key: 'map-mapbox',
          ref: this._mapboxMapLoaded,
          style: mapStyle,
          className: className
        }), (0, _react.createElement)('div', {
          key: 'map-overlays',
          // Same as interactive map's overlay container
          className: 'overlays',
          style: overlayContainerStyle,
          children: this.props.children
        }), this._renderNoTokenWarning()]
      });
    }
  }]);
  return StaticMap;
}(_react.PureComponent);

exports.default = StaticMap;


StaticMap.displayName = 'StaticMap';
StaticMap.propTypes = propTypes;
StaticMap.defaultProps = defaultProps;
StaticMap.childContextTypes = childContextTypes;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21wb25lbnRzL3N0YXRpYy1tYXAuanMiXSwibmFtZXMiOlsiVE9LRU5fRE9DX1VSTCIsIm5vb3AiLCJwcm9wVHlwZXMiLCJtYXBTdHlsZSIsIm9uZU9mVHlwZSIsInN0cmluZyIsImluc3RhbmNlT2YiLCJNYXAiLCJwcmV2ZW50U3R5bGVEaWZmaW5nIiwiYm9vbCIsInZpc2libGUiLCJkZWZhdWx0UHJvcHMiLCJjaGlsZENvbnRleHRUeXBlcyIsInZpZXdwb3J0IiwiU3RhdGljTWFwIiwic3VwcG9ydGVkIiwicHJvcHMiLCJfcXVlcnlQYXJhbXMiLCJjb21wb25lbnREaWRNb3VudCIsImNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMiLCJjb21wb25lbnREaWRVcGRhdGUiLCJzdGF0ZSIsIl9tYXBib3giLCJjb250YWluZXIiLCJfbWFwYm94TWFwIiwic3R5bGUiLCJ1bmRlZmluZWQiLCJfbWFwIiwiZ2V0TWFwIiwiX3VwZGF0ZU1hcFN0eWxlIiwiZm9yY2VVcGRhdGUiLCJuZXdQcm9wcyIsInNldFByb3BzIiwic2V0U3RhdGUiLCJ3aWR0aCIsImhlaWdodCIsIl91cGRhdGVNYXBTaXplIiwiZmluYWxpemUiLCJnZW9tZXRyeSIsInBhcmFtZXRlcnMiLCJxdWVyeVBhcmFtcyIsImxheWVycyIsImxlbmd0aCIsInF1ZXJ5UmVuZGVyZWRGZWF0dXJlcyIsImludGVyYWN0aXZlTGF5ZXJJZHMiLCJvbGRQcm9wcyIsInNpemVDaGFuZ2VkIiwicmVzaXplIiwib2xkTWFwU3R5bGUiLCJpc01hcCIsInNldFN0eWxlIiwidG9KUyIsIl91cGRhdGVRdWVyeVBhcmFtcyIsInJlZiIsImFjY2Vzc1Rva2VuIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwia2V5IiwiaWQiLCJocmVmIiwiY2xhc3NOYW1lIiwibWFwQ29udGFpbmVyU3R5bGUiLCJ2aXNpYmlsaXR5Iiwib3ZlcmxheUNvbnRhaW5lclN0eWxlIiwib3ZlcmZsb3ciLCJjaGlsZHJlbiIsIl9t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MUI7QUFDQSxVQUFNcEQsV0FBVyxzQkFBYyxFQUFkLEVBQWtCc0IsS0FBbEIsRUFBeUI7QUFDeENTLG9CQUR3QztBQUV4Q0Msc0JBRndDO0FBR3hDNEIsb0JBQVlyRCxVQUFVLFNBQVYsR0FBc0I7QUFITSxPQUF6QixDQUFqQjtBQUtBLFVBQU1zRCx3QkFBd0I7QUFDNUJULGtCQUFVLFVBRGtCO0FBRTVCQyxjQUFNLENBRnNCO0FBRzVCQyxhQUFLLENBSHVCO0FBSTVCdkIsb0JBSjRCO0FBSzVCQyxzQkFMNEI7QUFNNUI4QixrQkFBVTtBQU5rQixPQUE5Qjs7QUFTQTtBQUNBLGFBQ0UsMEJBQWMsS0FBZCxFQUFxQjtBQUNuQlAsYUFBSyxlQURjO0FBRW5CakMsZUFBT3FDLGlCQUZZO0FBR25CSSxrQkFBVSxDQUNSLDBCQUFjLEtBQWQsRUFBcUI7QUFDbkJSLGVBQUssWUFEYztBQUVuQkwsZUFBSyxLQUFLYyxnQkFGUztBQUduQjFDLGlCQUFPdEIsUUFIWTtBQUluQjBEO0FBSm1CLFNBQXJCLENBRFEsRUFPUiwwQkFBYyxLQUFkLEVBQXFCO0FBQ25CSCxlQUFLLGNBRGM7QUFFbkI7QUFDQUcscUJBQVcsVUFIUTtBQUluQnBDLGlCQUFPdUMscUJBSlk7QUFLbkJFLG9CQUFVLEtBQUtsRCxLQUFMLENBQVdrRDtBQUxGLFNBQXJCLENBUFEsRUFjUixLQUFLRSxxQkFBTCxFQWRRO0FBSFMsT0FBckIsQ0FERjtBQXNCRDs7Ozs7a0JBakxrQnRELFM7OztBQW9MckJBLFVBQVV1RCxXQUFWLEdBQXdCLFdBQXhCO0FBQ0F2RCxVQUFVWixTQUFWLEdBQXNCQSxTQUF0QjtBQUNBWSxVQUFVSCxZQUFWLEdBQXlCQSxZQUF6QjtBQUNBRyxVQUFVRixpQkFBVixHQUE4QkEsaUJBQTlCIiwiZmlsZSI6InN0YXRpYy1tYXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cblxuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuaW1wb3J0IHtQdXJlQ29tcG9uZW50LCBjcmVhdGVFbGVtZW50fSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGF1dG9iaW5kIGZyb20gJy4uL3V0aWxzL2F1dG9iaW5kJztcblxuaW1wb3J0IHtnZXRJbnRlcmFjdGl2ZUxheWVySWRzLCBzZXREaWZmU3R5bGV9IGZyb20gJy4uL3V0aWxzL3N0eWxlLXV0aWxzJztcbmltcG9ydCBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJztcblxuaW1wb3J0IHtQZXJzcGVjdGl2ZU1lcmNhdG9yVmlld3BvcnR9IGZyb20gJ3ZpZXdwb3J0LW1lcmNhdG9yLXByb2plY3QnO1xuXG5pbXBvcnQgTWFwYm94IGZyb20gJy4uL21hcGJveC9tYXBib3gnO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5jb25zdCBUT0tFTl9ET0NfVVJMID0gJ2h0dHBzOi8vdWJlci5naXRodWIuaW8vcmVhY3QtbWFwLWdsLyMvRG9jdW1lbnRhdGlvbi9nZXR0aW5nLXN0YXJ0ZWQvYWJvdXQtbWFwYm94LXRva2Vucyc7XG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBwcm9wVHlwZXMgPSBPYmplY3QuYXNzaWduKHt9LCBNYXBib3gucHJvcFR5cGVzLCB7XG4gIC8qKiBUaGUgTWFwYm94IHN0eWxlLiBBIHN0cmluZyB1cmwgb3IgYSBNYXBib3hHTCBzdHlsZSBJbW11dGFibGUuTWFwIG9iamVjdC4gKi9cbiAgbWFwU3R5bGU6IFByb3BUeXBlcy5vbmVPZlR5cGUoW1xuICAgIFByb3BUeXBlcy5zdHJpbmcsXG4gICAgUHJvcFR5cGVzLmluc3RhbmNlT2YoSW1tdXRhYmxlLk1hcClcbiAgXSksXG4gIC8qKiBUaGVyZSBhcmUga25vd24gaXNzdWVzIHdpdGggc3R5bGUgZGlmZmluZy4gQXMgc3RvcGdhcCwgYWRkIG9wdGlvbiB0byBwcmV2ZW50IHN0eWxlIGRpZmZpbmcuICovXG4gIHByZXZlbnRTdHlsZURpZmZpbmc6IFByb3BUeXBlcy5ib29sLFxuICAvKiogV2hldGhlciB0aGUgbWFwIGlzIHZpc2libGUgKi9cbiAgdmlzaWJsZTogUHJvcFR5cGVzLmJvb2xcbn0pO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCBNYXBib3guZGVmYXVsdFByb3BzLCB7XG4gIG1hcFN0eWxlOiAnbWFwYm94Oi8vc3R5bGVzL21hcGJveC9saWdodC12OCcsXG4gIHByZXZlbnRTdHlsZURpZmZpbmc6IGZhbHNlLFxuICB2aXNpYmxlOiB0cnVlXG59KTtcblxuY29uc3QgY2hpbGRDb250ZXh0VHlwZXMgPSB7XG4gIHZpZXdwb3J0OiBQcm9wVHlwZXMuaW5zdGFuY2VPZihQZXJzcGVjdGl2ZU1lcmNhdG9yVmlld3BvcnQpXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGF0aWNNYXAgZXh0ZW5kcyBQdXJlQ29tcG9uZW50IHtcbiAgc3RhdGljIHN1cHBvcnRlZCgpIHtcbiAgICByZXR1cm4gTWFwYm94ICYmIE1hcGJveC5zdXBwb3J0ZWQoKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuX3F1ZXJ5UGFyYW1zID0ge307XG4gICAgaWYgKCFTdGF0aWNNYXAuc3VwcG9ydGVkKCkpIHtcbiAgICAgIHRoaXMuY29tcG9uZW50RGlkTW91bnQgPSBub29wO1xuICAgICAgdGhpcy5jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzID0gbm9vcDtcbiAgICAgIHRoaXMuY29tcG9uZW50RGlkVXBkYXRlID0gbm9vcDtcbiAgICB9XG4gICAgdGhpcy5zdGF0ZSA9IHt9O1xuICAgIGF1dG9iaW5kKHRoaXMpO1xuICB9XG5cbiAgZ2V0Q2hpbGRDb250ZXh0KCkge1xuICAgIHJldHVybiB7XG4gICAgICB2aWV3cG9ydDogbmV3IFBlcnNwZWN0aXZlTWVyY2F0b3JWaWV3cG9ydCh0aGlzLnByb3BzKVxuICAgIH07XG4gIH1cblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLl9tYXBib3ggPSBuZXcgTWFwYm94KE9iamVjdC5hc3NpZ24oe30sIHRoaXMucHJvcHMsIHtcbiAgICAgIGNvbnRhaW5lcjogdGhpcy5fbWFwYm94TWFwLFxuICAgICAgc3R5bGU6IHVuZGVmaW5lZFxuICAgIH0pKTtcbiAgICB0aGlzLl9tYXAgPSB0aGlzLl9tYXBib3guZ2V0TWFwKCk7XG4gICAgdGhpcy5fdXBkYXRlTWFwU3R5bGUoe30sIHRoaXMucHJvcHMpO1xuICAgIHRoaXMuZm9yY2VVcGRhdGUoKTsgLy8gTWFrZSBzdXJlIHdlIHJlcmVuZGVyIGFmdGVyIG1vdW50aW5nXG4gIH1cblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5ld1Byb3BzKSB7XG4gICAgdGhpcy5fbWFwYm94LnNldFByb3BzKG5ld1Byb3BzKTtcbiAgICB0aGlzLl91cGRhdGVNYXBTdHlsZSh0aGlzLnByb3BzLCBuZXdQcm9wcyk7XG5cbiAgICAvLyB0aGlzLl91cGRhdGVNYXBWaWV3cG9ydCh0aGlzLnByb3BzLCBuZXdQcm9wcyk7XG5cbiAgICAvLyBTYXZlIHdpZHRoL2hlaWdodCBzbyB0aGF0IHdlIGNhbiBjaGVjayB0aGVtIGluIGNvbXBvbmVudERpZFVwZGF0ZVxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgd2lkdGg6IHRoaXMucHJvcHMud2lkdGgsXG4gICAgICBoZWlnaHQ6IHRoaXMucHJvcHMuaGVpZ2h0XG4gICAgfSk7XG4gIH1cblxuICBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgLy8gU2luY2UgTWFwYm94J3MgbWFwLnJlc2l6ZSgpIHJlYWRzIHNpemUgZnJvbSBET01cbiAgICAvLyB3ZSBtdXN0IHdhaXQgdG8gcmVhZCBzaXplIHVudGlsIGFmdGVyIHJlbmRlciAoaS5lLiBoZXJlIGluIFwiZGlkVXBkYXRlXCIpXG4gICAgdGhpcy5fdXBkYXRlTWFwU2l6ZSh0aGlzLnN0YXRlLCB0aGlzLnByb3BzKTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIHRoaXMuX21hcGJveC5maW5hbGl6ZSgpO1xuICAgIHRoaXMuX21hcGJveCA9IG51bGw7XG4gICAgdGhpcy5fbWFwID0gbnVsbDtcbiAgfVxuXG4gIC8vIEV4dGVybmFsIGFwcHMgY2FuIGFjY2VzcyBtYXAgdGhpcyB3YXlcbiAgZ2V0TWFwKCkge1xuICAgIHJldHVybiB0aGlzLl9tYXA7XG4gIH1cblxuICAvKiogVXNlcyBNYXBib3gnc1xuICAgICogcXVlcnlSZW5kZXJlZEZlYXR1cmVzIEFQSSB0byBmaW5kIGZlYXR1cmVzIGF0IHBvaW50IG9yIGluIGEgYm91bmRpbmcgYm94LlxuICAgICogaHR0cHM6Ly93d3cubWFwYm94LmNvbS9tYXBib3gtZ2wtanMvYXBpLyNNYXAjcXVlcnlSZW5kZXJlZEZlYXR1cmVzXG4gICAgKiBUbyBxdWVyeSBvbmx5IHNvbWUgb2YgdGhlIGxheWVycywgc2V0IHRoZSBgaW50ZXJhY3RpdmVgIHByb3BlcnR5IGluIHRoZVxuICAgICogbGF5ZXIgc3R5bGUgdG8gYHRydWVgLlxuICAgICogQHBhcmFtIHtbTnVtYmVyLCBOdW1iZXJdfFtbTnVtYmVyLCBOdW1iZXJdLCBbTnVtYmVyLCBOdW1iZXJdXX0gZ2VvbWV0cnkgLVxuICAgICogICBQb2ludCBvciBhbiBhcnJheSBvZiB0d28gcG9pbnRzIGRlZmluaW5nIHRoZSBib3VuZGluZyBib3hcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIC0gcXVlcnkgb3B0aW9uc1xuICAgICovXG4gIHF1ZXJ5UmVuZGVyZWRGZWF0dXJlcyhnZW9tZXRyeSwgcGFyYW1ldGVycykge1xuICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gcGFyYW1ldGVycyB8fCB0aGlzLl9xdWVyeVBhcmFtcztcbiAgICBpZiAocXVlcnlQYXJhbXMubGF5ZXJzICYmIHF1ZXJ5UGFyYW1zLmxheWVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX21hcC5xdWVyeVJlbmRlcmVkRmVhdHVyZXMoZ2VvbWV0cnksIHF1ZXJ5UGFyYW1zKTtcbiAgfVxuXG4gIC8vIEhvdmVyIGFuZCBjbGljayBvbmx5IHF1ZXJ5IGxheWVycyB3aG9zZSBpbnRlcmFjdGl2ZSBwcm9wZXJ0eSBpcyB0cnVlXG4gIF91cGRhdGVRdWVyeVBhcmFtcyhtYXBTdHlsZSkge1xuICAgIGNvbnN0IGludGVyYWN0aXZlTGF5ZXJJZHMgPSBnZXRJbnRlcmFjdGl2ZUxheWVySWRzKG1hcFN0eWxlKTtcbiAgICB0aGlzLl9xdWVyeVBhcmFtcyA9IHtsYXllcnM6IGludGVyYWN0aXZlTGF5ZXJJZHN9O1xuICB9XG5cbiAgLy8gTm90ZTogbmVlZHMgdG8gYmUgY2FsbGVkIGFmdGVyIHJlbmRlciAoZS5nLiBpbiBjb21wb25lbnREaWRVcGRhdGUpXG4gIF91cGRhdGVNYXBTaXplKG9sZFByb3BzLCBuZXdQcm9wcykge1xuICAgIGNvbnN0IHNpemVDaGFuZ2VkID1cbiAgICAgIG9sZFByb3BzLndpZHRoICE9PSBuZXdQcm9wcy53aWR0aCB8fCBvbGRQcm9wcy5oZWlnaHQgIT09IG5ld1Byb3BzLmhlaWdodDtcblxuICAgIGlmIChzaXplQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fbWFwLnJlc2l6ZSgpO1xuICAgICAgLy8gdGhpcy5fY2FsbE9uQ2hhbmdlVmlld3BvcnQodGhpcy5fbWFwLnRyYW5zZm9ybSk7XG4gICAgfVxuICB9XG5cbiAgX3VwZGF0ZU1hcFN0eWxlKG9sZFByb3BzLCBuZXdQcm9wcykge1xuICAgIGNvbnN0IG1hcFN0eWxlID0gbmV3UHJvcHMubWFwU3R5bGU7XG4gICAgY29uc3Qgb2xkTWFwU3R5bGUgPSBvbGRQcm9wcy5tYXBTdHlsZTtcbiAgICBpZiAobWFwU3R5bGUgIT09IG9sZE1hcFN0eWxlKSB7XG4gICAgICBpZiAoSW1tdXRhYmxlLk1hcC5pc01hcChtYXBTdHlsZSkpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMucHJldmVudFN0eWxlRGlmZmluZykge1xuICAgICAgICAgIHRoaXMuX21hcC5zZXRTdHlsZShtYXBTdHlsZS50b0pTKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldERpZmZTdHlsZShvbGRNYXBTdHlsZSwgbWFwU3R5bGUsIHRoaXMuX21hcCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX21hcC5zZXRTdHlsZShtYXBTdHlsZSk7XG4gICAgICB9XG4gICAgICB0aGlzLl91cGRhdGVRdWVyeVBhcmFtcyhtYXBTdHlsZSk7XG4gICAgfVxuICB9XG5cbiAgX21hcGJveE1hcExvYWRlZChyZWYpIHtcbiAgICB0aGlzLl9tYXBib3hNYXAgPSByZWY7XG4gIH1cblxuICBfcmVuZGVyTm9Ub2tlbldhcm5pbmcoKSB7XG4gICAgaWYgKHRoaXMuX21hcGJveCAmJiAhdGhpcy5fbWFwYm94LmFjY2Vzc1Rva2VuKSB7XG4gICAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMFxuICAgICAgfTtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIGNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtrZXk6ICd3YXJuaW5nJywgaWQ6ICduby10b2tlbi13YXJuaW5nJywgc3R5bGV9LCBbXG4gICAgICAgICAgY3JlYXRlRWxlbWVudCgnaDMnLCB7a2V5OiAnaGVhZGVyJ30sICdObyBNYXBib3ggYWNjZXNzIHRva2VuIGZvdW5kJyksXG4gICAgICAgICAgY3JlYXRlRWxlbWVudCgnZGl2Jywge2tleTogJ3RleHQnfSwgJ0ZvciBpbmZvcm1hdGlvbiBvbiBzZXR0aW5nIHVwIHlvdXIgYmFzZW1hcCwgcmVhZCcpLFxuICAgICAgICAgIGNyZWF0ZUVsZW1lbnQoJ2EnLCB7a2V5OiAnbGluaycsIGhyZWY6IFRPS0VOX0RPQ19VUkx9LCAnTm90ZSBvbiBNYXAgVG9rZW5zJylcbiAgICAgICAgXSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3Qge2NsYXNzTmFtZSwgd2lkdGgsIGhlaWdodCwgc3R5bGUsIHZpc2libGV9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBtYXBDb250YWluZXJTdHlsZSA9IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlLCB7d2lkdGgsIGhlaWdodCwgcG9zaXRpb246ICdyZWxhdGl2ZSd9KTtcbiAgICBjb25zdCBtYXBTdHlsZSA9IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlLCB7XG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIHZpc2liaWxpdHk6IHZpc2libGUgPyAndmlzaWJsZScgOiAnaGlkZGVuJ1xuICAgIH0pO1xuICAgIGNvbnN0IG92ZXJsYXlDb250YWluZXJTdHlsZSA9IHtcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgbGVmdDogMCxcbiAgICAgIHRvcDogMCxcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nXG4gICAgfTtcblxuICAgIC8vIE5vdGU6IGEgc3RhdGljIG1hcCBzdGlsbCBoYW5kbGVzIGNsaWNrcyBhbmQgaG92ZXIgZXZlbnRzXG4gICAgcmV0dXJuIChcbiAgICAgIGNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcbiAgICAgICAga2V5OiAnbWFwLWNvbnRhaW5lcicsXG4gICAgICAgIHN0eWxlOiBtYXBDb250YWluZXJTdHlsZSxcbiAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICBjcmVhdGVFbGVtZW50KCdkaXYnLCB7XG4gICAgICAgICAgICBrZXk6ICdtYXAtbWFwYm94JyxcbiAgICAgICAgICAgIHJlZjogdGhpcy5fbWFwYm94TWFwTG9hZGVkLFxuICAgICAgICAgICAgc3R5bGU6IG1hcFN0eWxlLFxuICAgICAgICAgICAgY2xhc3NOYW1lXG4gICAgICAgICAgfSksXG4gICAgICAgICAgY3JlYXRlRWxlbWVudCgnZGl2Jywge1xuICAgICAgICAgICAga2V5OiAnbWFwLW92ZXJsYXlzJyxcbiAgICAgICAgICAgIC8vIFNhbWUgYXMgaW50ZXJhY3RpdmUgbWFwJ3Mgb3ZlcmxheSBjb250YWluZXJcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJ292ZXJsYXlzJyxcbiAgICAgICAgICAgIHN0eWxlOiBvdmVybGF5Q29udGFpbmVyU3R5bGUsXG4gICAgICAgICAgICBjaGlsZHJlbjogdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRoaXMuX3JlbmRlck5vVG9rZW5XYXJuaW5nKClcbiAgICAgICAgXVxuICAgICAgfSlcbiAgICApO1xuICB9XG59XG5cblN0YXRpY01hcC5kaXNwbGF5TmFtZSA9ICdTdGF0aWNNYXAnO1xuU3RhdGljTWFwLnByb3BUeXBlcyA9IHByb3BUeXBlcztcblN0YXRpY01hcC5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG5TdGF0aWNNYXAuY2hpbGRDb250ZXh0VHlwZXMgPSBjaGlsZENvbnRleHRUeXBlcztcbiJdfQ==