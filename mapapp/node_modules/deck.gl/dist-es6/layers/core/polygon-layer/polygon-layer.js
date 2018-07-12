var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { CompositeLayer, get } from '../../../lib';
import SolidPolygonLayer from '../solid-polygon-layer/solid-polygon-layer';
import PathLayer from '../path-layer/path-layer';
import * as Polygon from '../solid-polygon-layer/polygon';

var defaultLineColor = [0x0, 0x0, 0x0, 0xFF];
var defaultFillColor = [0x0, 0x0, 0x0, 0xFF];

var defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  wireframe: false,

  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  lineJointRounded: false,
  lineMiterLimit: 4,
  fp64: false,

  getPolygon: function getPolygon(f) {
    return get(f, 'polygon');
  },
  // Polygon fill color
  getFillColor: function getFillColor(f) {
    return get(f, 'fillColor') || defaultFillColor;
  },
  // Point, line and polygon outline color
  getLineColor: function getLineColor(f) {
    return get(f, 'lineColor') || defaultLineColor;
  },
  // Line and polygon outline accessors
  getLineWidth: function getLineWidth(f) {
    return get(f, 'lineWidth') || 1;
  },
  // Polygon extrusion accessor
  getElevation: function getElevation(f) {
    return get(f, 'elevation') || 1000;
  },

  // Optional settings for 'lighting' shader module
  lightSettings: {
    lightsPosition: [-122.45, 37.75, 8000, -122.0, 38.00, 5000],
    ambientRatio: 0.05,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [2.0, 0.0, 0.0, 0.0],
    numberOfLights: 2
  }
};

var PolygonLayer = function (_CompositeLayer) {
  _inherits(PolygonLayer, _CompositeLayer);

  function PolygonLayer() {
    _classCallCheck(this, PolygonLayer);

    return _possibleConstructorReturn(this, (PolygonLayer.__proto__ || Object.getPrototypeOf(PolygonLayer)).apply(this, arguments));
  }

  _createClass(PolygonLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      this.state = {
        paths: []
      };
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var _this2 = this;

      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;

      if (changeFlags.dataChanged) {
        var _props = this.props,
            data = _props.data,
            getPolygon = _props.getPolygon;

        this.state.paths = [];
        data.forEach(function (object) {
          var complexPolygon = Polygon.normalize(getPolygon(object));
          complexPolygon.forEach(function (polygon) {
            return _this2.state.paths.push({
              path: polygon,
              object: object
            });
          });
        });
      }
    }
  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(_ref2) {
      var info = _ref2.info;

      return Object.assign(info, {
        // override object with picked data
        object: info.object && info.object.object || info.object
      });
    }
  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      // Layer composition props
      var _props2 = this.props,
          data = _props2.data,
          id = _props2.id,
          stroked = _props2.stroked,
          filled = _props2.filled,
          extruded = _props2.extruded,
          wireframe = _props2.wireframe;

      // Rendering props underlying layer

      var _props3 = this.props,
          lineWidthScale = _props3.lineWidthScale,
          lineWidthMinPixels = _props3.lineWidthMinPixels,
          lineWidthMaxPixels = _props3.lineWidthMaxPixels,
          lineJointRounded = _props3.lineJointRounded,
          lineMiterLimit = _props3.lineMiterLimit,
          fp64 = _props3.fp64;

      // Accessor props for underlying layers

      var _props4 = this.props,
          getFillColor = _props4.getFillColor,
          getLineColor = _props4.getLineColor,
          getLineWidth = _props4.getLineWidth,
          getElevation = _props4.getElevation,
          getPolygon = _props4.getPolygon,
          updateTriggers = _props4.updateTriggers,
          lightSettings = _props4.lightSettings;

      // base layer props

      var _props5 = this.props,
          opacity = _props5.opacity,
          pickable = _props5.pickable,
          visible = _props5.visible,
          getPolygonOffset = _props5.getPolygonOffset;

      // viewport props

      var _props6 = this.props,
          positionOrigin = _props6.positionOrigin,
          projectionMode = _props6.projectionMode,
          modelMatrix = _props6.modelMatrix;
      var paths = this.state.paths;


      var hasData = data && data.length > 0;

      // Filled Polygon Layer
      var polygonLayer = filled && hasData && new SolidPolygonLayer({
        id: id + '-fill',
        data: data,
        extruded: extruded,
        wireframe: false,
        fp64: fp64,
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        getPolygonOffset: getPolygonOffset,
        projectionMode: projectionMode,
        positionOrigin: positionOrigin,
        modelMatrix: modelMatrix,
        getPolygon: getPolygon,
        getElevation: getElevation,
        getColor: getFillColor,
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getFillColor
        },
        lightSettings: lightSettings
      });

      var polygonWireframeLayer = extruded && wireframe && hasData && new SolidPolygonLayer({
        id: id + '-wireframe',
        data: data,
        extruded: true,
        wireframe: true,
        fp64: fp64,
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        getPolygonOffset: getPolygonOffset,
        projectionMode: projectionMode,
        positionOrigin: positionOrigin,
        modelMatrix: modelMatrix,
        getPolygon: getPolygon,
        getElevation: getElevation,
        getColor: getLineColor,
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getLineColor
        }
      });

      // Polygon line layer
      var polygonLineLayer = !extruded && stroked && hasData && new PathLayer({
        id: id + '-stroke',
        data: paths,
        widthScale: lineWidthScale,
        widthMinPixels: lineWidthMinPixels,
        widthMaxPixels: lineWidthMaxPixels,
        rounded: lineJointRounded,
        miterLimit: lineMiterLimit,
        fp64: fp64,
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        getPolygonOffset: getPolygonOffset,
        projectionMode: projectionMode,
        positionOrigin: positionOrigin,
        modelMatrix: modelMatrix,
        getPath: function getPath(x) {
          return x.path;
        },
        getColor: getLineColor,
        getWidth: getLineWidth,
        updateTriggers: {
          getWidth: updateTriggers.getLineWidth,
          getColor: updateTriggers.getLineColor
        }
      });

      return [
      // If not extruded: flat fill layer is drawn below outlines
      !extruded && polygonLayer, polygonWireframeLayer, polygonLineLayer,
      // If extruded: draw fill layer last for correct blending behavior
      extruded && polygonLayer];
    }
  }]);

  return PolygonLayer;
}(CompositeLayer);

export default PolygonLayer;


PolygonLayer.layerName = 'PolygonLayer';
PolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wb2x5Z29uLWxheWVyL3BvbHlnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiQ29tcG9zaXRlTGF5ZXIiLCJnZXQiLCJTb2xpZFBvbHlnb25MYXllciIsIlBhdGhMYXllciIsIlBvbHlnb24iLCJkZWZhdWx0TGluZUNvbG9yIiwiZGVmYXVsdEZpbGxDb2xvciIsImRlZmF1bHRQcm9wcyIsInN0cm9rZWQiLCJmaWxsZWQiLCJleHRydWRlZCIsIndpcmVmcmFtZSIsImxpbmVXaWR0aFNjYWxlIiwibGluZVdpZHRoTWluUGl4ZWxzIiwibGluZVdpZHRoTWF4UGl4ZWxzIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImxpbmVKb2ludFJvdW5kZWQiLCJsaW5lTWl0ZXJMaW1pdCIsImZwNjQiLCJnZXRQb2x5Z29uIiwiZiIsImdldEZpbGxDb2xvciIsImdldExpbmVDb2xvciIsImdldExpbmVXaWR0aCIsImdldEVsZXZhdGlvbiIsImxpZ2h0U2V0dGluZ3MiLCJsaWdodHNQb3NpdGlvbiIsImFtYmllbnRSYXRpbyIsImRpZmZ1c2VSYXRpbyIsInNwZWN1bGFyUmF0aW8iLCJsaWdodHNTdHJlbmd0aCIsIm51bWJlck9mTGlnaHRzIiwiUG9seWdvbkxheWVyIiwic3RhdGUiLCJwYXRocyIsIm9sZFByb3BzIiwicHJvcHMiLCJjaGFuZ2VGbGFncyIsImRhdGFDaGFuZ2VkIiwiZGF0YSIsImZvckVhY2giLCJjb21wbGV4UG9seWdvbiIsIm5vcm1hbGl6ZSIsIm9iamVjdCIsInB1c2giLCJwYXRoIiwicG9seWdvbiIsImluZm8iLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsInVwZGF0ZVRyaWdnZXJzIiwib3BhY2l0eSIsInBpY2thYmxlIiwidmlzaWJsZSIsImdldFBvbHlnb25PZmZzZXQiLCJwb3NpdGlvbk9yaWdpbiIsInByb2plY3Rpb25Nb2RlIiwibW9kZWxNYXRyaXgiLCJoYXNEYXRhIiwibGVuZ3RoIiwicG9seWdvbkxheWVyIiwiZ2V0Q29sb3IiLCJwb2x5Z29uV2lyZWZyYW1lTGF5ZXIiLCJwb2x5Z29uTGluZUxheWVyIiwid2lkdGhTY2FsZSIsIndpZHRoTWluUGl4ZWxzIiwid2lkdGhNYXhQaXhlbHMiLCJyb3VuZGVkIiwibWl0ZXJMaW1pdCIsImdldFBhdGgiLCJ4IiwiZ2V0V2lkdGgiLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBUUEsY0FBUixFQUF3QkMsR0FBeEIsUUFBa0MsY0FBbEM7QUFDQSxPQUFPQyxpQkFBUCxNQUE4Qiw0Q0FBOUI7QUFDQSxPQUFPQyxTQUFQLE1BQXNCLDBCQUF0QjtBQUNBLE9BQU8sS0FBS0MsT0FBWixNQUF5QixnQ0FBekI7O0FBRUEsSUFBTUMsbUJBQW1CLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLElBQWhCLENBQXpCO0FBQ0EsSUFBTUMsbUJBQW1CLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLElBQWhCLENBQXpCOztBQUVBLElBQU1DLGVBQWU7QUFDbkJDLFdBQVMsSUFEVTtBQUVuQkMsVUFBUSxJQUZXO0FBR25CQyxZQUFVLEtBSFM7QUFJbkJDLGFBQVcsS0FKUTs7QUFNbkJDLGtCQUFnQixDQU5HO0FBT25CQyxzQkFBb0IsQ0FQRDtBQVFuQkMsc0JBQW9CQyxPQUFPQyxnQkFSUjtBQVNuQkMsb0JBQWtCLEtBVEM7QUFVbkJDLGtCQUFnQixDQVZHO0FBV25CQyxRQUFNLEtBWGE7O0FBYW5CQyxjQUFZO0FBQUEsV0FBS25CLElBQUlvQixDQUFKLEVBQU8sU0FBUCxDQUFMO0FBQUEsR0FiTztBQWNuQjtBQUNBQyxnQkFBYztBQUFBLFdBQUtyQixJQUFJb0IsQ0FBSixFQUFPLFdBQVAsS0FBdUJmLGdCQUE1QjtBQUFBLEdBZks7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Q2IsUUFBRCxJQUFhb0QsWUFGUixFQUdMRSxxQkFISyxFQUlMQyxnQkFKSztBQUtMO0FBQ0F2RCxrQkFBWW9ELFlBTlAsQ0FBUDtBQVFEOzs7O0VBeEl1QzlELGM7O2VBQXJCaUMsWTs7O0FBMklyQkEsYUFBYXlDLFNBQWIsR0FBeUIsY0FBekI7QUFDQXpDLGFBQWExQixZQUFiLEdBQTRCQSxZQUE1QiIsImZpbGUiOiJwb2x5Z29uLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7Q29tcG9zaXRlTGF5ZXIsIGdldH0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCBTb2xpZFBvbHlnb25MYXllciBmcm9tICcuLi9zb2xpZC1wb2x5Z29uLWxheWVyL3NvbGlkLXBvbHlnb24tbGF5ZXInO1xuaW1wb3J0IFBhdGhMYXllciBmcm9tICcuLi9wYXRoLWxheWVyL3BhdGgtbGF5ZXInO1xuaW1wb3J0ICogYXMgUG9seWdvbiBmcm9tICcuLi9zb2xpZC1wb2x5Z29uLWxheWVyL3BvbHlnb24nO1xuXG5jb25zdCBkZWZhdWx0TGluZUNvbG9yID0gWzB4MCwgMHgwLCAweDAsIDB4RkZdO1xuY29uc3QgZGVmYXVsdEZpbGxDb2xvciA9IFsweDAsIDB4MCwgMHgwLCAweEZGXTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBzdHJva2VkOiB0cnVlLFxuICBmaWxsZWQ6IHRydWUsXG4gIGV4dHJ1ZGVkOiBmYWxzZSxcbiAgd2lyZWZyYW1lOiBmYWxzZSxcblxuICBsaW5lV2lkdGhTY2FsZTogMSxcbiAgbGluZVdpZHRoTWluUGl4ZWxzOiAwLFxuICBsaW5lV2lkdGhNYXhQaXhlbHM6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLFxuICBsaW5lSm9pbnRSb3VuZGVkOiBmYWxzZSxcbiAgbGluZU1pdGVyTGltaXQ6IDQsXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIGdldFBvbHlnb246IGYgPT4gZ2V0KGYsICdwb2x5Z29uJyksXG4gIC8vIFBvbHlnb24gZmlsbCBjb2xvclxuICBnZXRGaWxsQ29sb3I6IGYgPT4gZ2V0KGYsICdmaWxsQ29sb3InKSB8fCBkZWZhdWx0RmlsbENvbG9yLFxuICAvLyBQb2ludCwgbGluZSBhbmQgcG9seWdvbiBvdXRsaW5lIGNvbG9yXG4gIGdldExpbmVDb2xvcjogZiA9PiBnZXQoZiwgJ2xpbmVDb2xvcicpIHx8IGRlZmF1bHRMaW5lQ29sb3IsXG4gIC8vIExpbmUgYW5kIHBvbHlnb24gb3V0bGluZSBhY2Nlc3NvcnNcbiAgZ2V0TGluZVdpZHRoOiBmID0+IGdldChmLCAnbGluZVdpZHRoJykgfHwgMSxcbiAgLy8gUG9seWdvbiBleHRydXNpb24gYWNjZXNzb3JcbiAgZ2V0RWxldmF0aW9uOiBmID0+IGdldChmLCAnZWxldmF0aW9uJykgfHwgMTAwMCxcblxuICAvLyBPcHRpb25hbCBzZXR0aW5ncyBmb3IgJ2xpZ2h0aW5nJyBzaGFkZXIgbW9kdWxlXG4gIGxpZ2h0U2V0dGluZ3M6IHtcbiAgICBsaWdodHNQb3NpdGlvbjogWy0xMjIuNDUsIDM3Ljc1LCA4MDAwLCAtMTIyLjAsIDM4LjAwLCA1MDAwXSxcbiAgICBhbWJpZW50UmF0aW86IDAuMDUsXG4gICAgZGlmZnVzZVJhdGlvOiAwLjYsXG4gICAgc3BlY3VsYXJSYXRpbzogMC44LFxuICAgIGxpZ2h0c1N0cmVuZ3RoOiBbMi4wLCAwLjAsIDAuMCwgMC4wXSxcbiAgICBudW1iZXJPZkxpZ2h0czogMlxuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQb2x5Z29uTGF5ZXIgZXh0ZW5kcyBDb21wb3NpdGVMYXllciB7XG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgcGF0aHM6IFtdXG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChjaGFuZ2VGbGFncy5kYXRhQ2hhbmdlZCkge1xuICAgICAgY29uc3Qge2RhdGEsIGdldFBvbHlnb259ID0gdGhpcy5wcm9wcztcbiAgICAgIHRoaXMuc3RhdGUucGF0aHMgPSBbXTtcbiAgICAgIGRhdGEuZm9yRWFjaChvYmplY3QgPT4ge1xuICAgICAgICBjb25zdCBjb21wbGV4UG9seWdvbiA9IFBvbHlnb24ubm9ybWFsaXplKGdldFBvbHlnb24ob2JqZWN0KSk7XG4gICAgICAgIGNvbXBsZXhQb2x5Z29uLmZvckVhY2gocG9seWdvbiA9PiB0aGlzLnN0YXRlLnBhdGhzLnB1c2goe1xuICAgICAgICAgIHBhdGg6IHBvbHlnb24sXG4gICAgICAgICAgb2JqZWN0XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGdldFBpY2tpbmdJbmZvKHtpbmZvfSkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKGluZm8sIHtcbiAgICAgIC8vIG92ZXJyaWRlIG9iamVjdCB3aXRoIHBpY2tlZCBkYXRhXG4gICAgICBvYmplY3Q6IChpbmZvLm9iamVjdCAmJiBpbmZvLm9iamVjdC5vYmplY3QpIHx8IGluZm8ub2JqZWN0XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJMYXllcnMoKSB7XG4gICAgLy8gTGF5ZXIgY29tcG9zaXRpb24gcHJvcHNcbiAgICBjb25zdCB7ZGF0YSwgaWQsIHN0cm9rZWQsIGZpbGxlZCwgZXh0cnVkZWQsIHdpcmVmcmFtZX0gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gUmVuZGVyaW5nIHByb3BzIHVuZGVybHlpbmcgbGF5ZXJcbiAgICBjb25zdCB7bGluZVdpZHRoU2NhbGUsIGxpbmVXaWR0aE1pblBpeGVscywgbGluZVdpZHRoTWF4UGl4ZWxzLFxuICAgICAgbGluZUpvaW50Um91bmRlZCwgbGluZU1pdGVyTGltaXQsIGZwNjR9ID0gdGhpcy5wcm9wcztcblxuICAgIC8vIEFjY2Vzc29yIHByb3BzIGZvciB1bmRlcmx5aW5nIGxheWVyc1xuICAgIGNvbnN0IHtnZXRGaWxsQ29sb3IsIGdldExpbmVDb2xvciwgZ2V0TGluZVdpZHRoLCBnZXRFbGV2YXRpb24sXG4gICAgICBnZXRQb2x5Z29uLCB1cGRhdGVUcmlnZ2VycywgbGlnaHRTZXR0aW5nc30gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gYmFzZSBsYXllciBwcm9wc1xuICAgIGNvbnN0IHtvcGFjaXR5LCBwaWNrYWJsZSwgdmlzaWJsZSwgZ2V0UG9seWdvbk9mZnNldH0gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gdmlld3BvcnQgcHJvcHNcbiAgICBjb25zdCB7cG9zaXRpb25PcmlnaW4sIHByb2plY3Rpb25Nb2RlLCBtb2RlbE1hdHJpeH0gPSB0aGlzLnByb3BzO1xuXG4gICAgY29uc3Qge3BhdGhzfSA9IHRoaXMuc3RhdGU7XG5cbiAgICBjb25zdCBoYXNEYXRhID0gZGF0YSAmJiBkYXRhLmxlbmd0aCA+IDA7XG5cbiAgICAvLyBGaWxsZWQgUG9seWdvbiBMYXllclxuICAgIGNvbnN0IHBvbHlnb25MYXllciA9IGZpbGxlZCAmJiBoYXNEYXRhICYmIG5ldyBTb2xpZFBvbHlnb25MYXllcih7XG4gICAgICBpZDogYCR7aWR9LWZpbGxgLFxuICAgICAgZGF0YSxcbiAgICAgIGV4dHJ1ZGVkLFxuICAgICAgd2lyZWZyYW1lOiBmYWxzZSxcbiAgICAgIGZwNjQsXG4gICAgICBvcGFjaXR5LFxuICAgICAgcGlja2FibGUsXG4gICAgICB2aXNpYmxlLFxuICAgICAgZ2V0UG9seWdvbk9mZnNldCxcbiAgICAgIHByb2plY3Rpb25Nb2RlLFxuICAgICAgcG9zaXRpb25PcmlnaW4sXG4gICAgICBtb2RlbE1hdHJpeCxcbiAgICAgIGdldFBvbHlnb24sXG4gICAgICBnZXRFbGV2YXRpb24sXG4gICAgICBnZXRDb2xvcjogZ2V0RmlsbENvbG9yLFxuICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgZ2V0RWxldmF0aW9uOiB1cGRhdGVUcmlnZ2Vycy5nZXRFbGV2YXRpb24sXG4gICAgICAgIGdldENvbG9yOiB1cGRhdGVUcmlnZ2Vycy5nZXRGaWxsQ29sb3JcbiAgICAgIH0sXG4gICAgICBsaWdodFNldHRpbmdzXG4gICAgfSk7XG5cbiAgICBjb25zdCBwb2x5Z29uV2lyZWZyYW1lTGF5ZXIgPSBleHRydWRlZCAmJlxuICAgICAgd2lyZWZyYW1lICYmXG4gICAgICBoYXNEYXRhICYmXG4gICAgICBuZXcgU29saWRQb2x5Z29uTGF5ZXIoe1xuICAgICAgICBpZDogYCR7aWR9LXdpcmVmcmFtZWAsXG4gICAgICAgIGRhdGEsXG4gICAgICAgIGV4dHJ1ZGVkOiB0cnVlLFxuICAgICAgICB3aXJlZnJhbWU6IHRydWUsXG4gICAgICAgIGZwNjQsXG4gICAgICAgIG9wYWNpdHksXG4gICAgICAgIHBpY2thYmxlLFxuICAgICAgICB2aXNpYmxlLFxuICAgICAgICBnZXRQb2x5Z29uT2Zmc2V0LFxuICAgICAgICBwcm9qZWN0aW9uTW9kZSxcbiAgICAgICAgcG9zaXRpb25PcmlnaW4sXG4gICAgICAgIG1vZGVsTWF0cml4LFxuICAgICAgICBnZXRQb2x5Z29uLFxuICAgICAgICBnZXRFbGV2YXRpb24sXG4gICAgICAgIGdldENvbG9yOiBnZXRMaW5lQ29sb3IsXG4gICAgICAgIHVwZGF0ZVRyaWdnZXJzOiB7XG4gICAgICAgICAgZ2V0RWxldmF0aW9uOiB1cGRhdGVUcmlnZ2Vycy5nZXRFbGV2YXRpb24sXG4gICAgICAgICAgZ2V0Q29sb3I6IHVwZGF0ZVRyaWdnZXJzLmdldExpbmVDb2xvclxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIC8vIFBvbHlnb24gbGluZSBsYXllclxuICAgIGNvbnN0IHBvbHlnb25MaW5lTGF5ZXIgPSAhZXh0cnVkZWQgJiZcbiAgICAgIHN0cm9rZWQgJiZcbiAgICAgIGhhc0RhdGEgJiZcbiAgICAgIG5ldyBQYXRoTGF5ZXIoe1xuICAgICAgICBpZDogYCR7aWR9LXN0cm9rZWAsXG4gICAgICAgIGRhdGE6IHBhdGhzLFxuICAgICAgICB3aWR0aFNjYWxlOiBsaW5lV2lkdGhTY2FsZSxcbiAgICAgICAgd2lkdGhNaW5QaXhlbHM6IGxpbmVXaWR0aE1pblBpeGVscyxcbiAgICAgICAgd2lkdGhNYXhQaXhlbHM6IGxpbmVXaWR0aE1heFBpeGVscyxcbiAgICAgICAgcm91bmRlZDogbGluZUpvaW50Um91bmRlZCxcbiAgICAgICAgbWl0ZXJMaW1pdDogbGluZU1pdGVyTGltaXQsXG4gICAgICAgIGZwNjQsXG4gICAgICAgIG9wYWNpdHksXG4gICAgICAgIHBpY2thYmxlLFxuICAgICAgICB2aXNpYmxlLFxuICAgICAgICBnZXRQb2x5Z29uT2Zmc2V0LFxuICAgICAgICBwcm9qZWN0aW9uTW9kZSxcbiAgICAgICAgcG9zaXRpb25PcmlnaW4sXG4gICAgICAgIG1vZGVsTWF0cml4LFxuICAgICAgICBnZXRQYXRoOiB4ID0+IHgucGF0aCxcbiAgICAgICAgZ2V0Q29sb3I6IGdldExpbmVDb2xvcixcbiAgICAgICAgZ2V0V2lkdGg6IGdldExpbmVXaWR0aCxcbiAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICBnZXRXaWR0aDogdXBkYXRlVHJpZ2dlcnMuZ2V0TGluZVdpZHRoLFxuICAgICAgICAgIGdldENvbG9yOiB1cGRhdGVUcmlnZ2Vycy5nZXRMaW5lQ29sb3JcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICByZXR1cm4gW1xuICAgICAgLy8gSWYgbm90IGV4dHJ1ZGVkOiBmbGF0IGZpbGwgbGF5ZXIgaXMgZHJhd24gYmVsb3cgb3V0bGluZXNcbiAgICAgICFleHRydWRlZCAmJiBwb2x5Z29uTGF5ZXIsXG4gICAgICBwb2x5Z29uV2lyZWZyYW1lTGF5ZXIsXG4gICAgICBwb2x5Z29uTGluZUxheWVyLFxuICAgICAgLy8gSWYgZXh0cnVkZWQ6IGRyYXcgZmlsbCBsYXllciBsYXN0IGZvciBjb3JyZWN0IGJsZW5kaW5nIGJlaGF2aW9yXG4gICAgICBleHRydWRlZCAmJiBwb2x5Z29uTGF5ZXJcbiAgICBdO1xuICB9XG59XG5cblBvbHlnb25MYXllci5sYXllck5hbWUgPSAnUG9seWdvbkxheWVyJztcblBvbHlnb25MYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=