var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

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

import { Layer } from '../../../lib';
import { get } from '../../../lib/utils';
import { GL, Model, Geometry } from 'luma.gl';
import { enable64bitSupport } from '../../../lib/utils/fp64';
import { COORDINATE_SYSTEM } from '../../../lib';

// Polygon geometry generation is managed by the polygon tesselator
import { PolygonTesselator } from './polygon-tesselator';
import { PolygonTesselatorExtruded } from './polygon-tesselator-extruded';

import vs from './solid-polygon-layer-vertex.glsl';
import vs64 from './solid-polygon-layer-vertex-64.glsl';
import fs from './solid-polygon-layer-fragment.glsl';

var defaultProps = {
  // Whether to extrude
  extruded: false,
  // Whether to draw a GL.LINES wireframe of the polygon
  wireframe: false,
  fp64: false,

  // Accessor for polygon geometry
  getPolygon: function getPolygon(f) {
    return get(f, 'polygon') || get(f, 'geometry.coordinates');
  },
  // Accessor for extrusion height
  getElevation: function getElevation(f) {
    return get(f, 'elevation') || get(f, 'properties.height') || 0;
  },
  // Accessor for color
  getColor: function getColor(f) {
    return get(f, 'color') || get(f, 'properties.color');
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

var SolidPolygonLayer = function (_Layer) {
  _inherits(SolidPolygonLayer, _Layer);

  function SolidPolygonLayer() {
    _classCallCheck(this, SolidPolygonLayer);

    return _possibleConstructorReturn(this, (SolidPolygonLayer.__proto__ || Object.getPrototypeOf(SolidPolygonLayer)).apply(this, arguments));
  }

  _createClass(SolidPolygonLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return enable64bitSupport(this.props) ? { vs: vs64, fs: fs, modules: ['project64', 'lighting'] } : { vs: vs, fs: fs, modules: ['lighting'] }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({
        model: this._getModel(gl),
        numInstances: 0,
        IndexType: gl.getExtension('OES_element_index_uint') ? Uint32Array : Uint16Array
      });

      var attributeManager = this.state.attributeManager;

      var noAlloc = true;
      /* eslint-disable max-len */
      attributeManager.add({
        indices: { size: 1, isIndexed: true, update: this.calculateIndices, noAlloc: noAlloc },
        positions: { size: 3, accessor: 'getElevation', update: this.calculatePositions, noAlloc: noAlloc },
        normals: { size: 3, update: this.calculateNormals, noAlloc: noAlloc },
        colors: { size: 4, type: GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateColors, noAlloc: noAlloc },
        pickingColors: { size: 3, type: GL.UNSIGNED_BYTE, update: this.calculatePickingColors, noAlloc: noAlloc }
      });
      /* eslint-enable max-len */
    }
  }, {
    key: 'updateAttribute',
    value: function updateAttribute(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      if (props.fp64 !== oldProps.fp64) {
        var attributeManager = this.state.attributeManager;

        attributeManager.invalidateAll();

        if (props.fp64 && props.projectionMode === COORDINATE_SYSTEM.LNGLAT) {
          attributeManager.add({
            positions64xyLow: { size: 2, update: this.calculatePositionsLow }
          });
        } else {
          attributeManager.remove(['positions64xyLow']);
        }
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;
      var _props = this.props,
          extruded = _props.extruded,
          lightSettings = _props.lightSettings;


      this.state.model.render(Object.assign({}, uniforms, {
        extruded: extruded ? 1.0 : 0.0
      }, lightSettings));
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref3) {
      var props = _ref3.props,
          oldProps = _ref3.oldProps,
          changeFlags = _ref3.changeFlags;

      _get(SolidPolygonLayer.prototype.__proto__ || Object.getPrototypeOf(SolidPolygonLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

      var regenerateModel = this.updateGeometry({ props: props, oldProps: oldProps, changeFlags: changeFlags });

      if (regenerateModel) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
    }
  }, {
    key: 'updateGeometry',
    value: function updateGeometry(_ref4) {
      var _this2 = this;

      var props = _ref4.props,
          oldProps = _ref4.oldProps,
          changeFlags = _ref4.changeFlags;

      var geometryConfigChanged = props.extruded !== oldProps.extruded || props.wireframe !== oldProps.wireframe || props.fp64 !== oldProps.fp64;

      // When the geometry config  or the data is changed,
      // tessellator needs to be invoked
      if (changeFlags.dataChanged || geometryConfigChanged) {
        var getPolygon = props.getPolygon,
            extruded = props.extruded,
            wireframe = props.wireframe,
            getElevation = props.getElevation;

        // TODO - avoid creating a temporary array here: let the tesselator iterate

        var polygons = props.data.map(getPolygon);

        this.setState({
          polygonTesselator: !extruded ? new PolygonTesselator({ polygons: polygons, fp64: this.props.fp64 }) : new PolygonTesselatorExtruded({ polygons: polygons, wireframe: wireframe,
            getHeight: function getHeight(polygonIndex) {
              return getElevation(_this2.props.data[polygonIndex]);
            },
            fp64: this.props.fp64
          })
        });

        this.state.attributeManager.invalidateAll();
      }

      return geometryConfigChanged;
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      return new Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new Geometry({
          drawMode: this.props.wireframe ? GL.LINES : GL.TRIANGLES
        }),
        vertexCount: 0,
        isIndexed: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: 'calculateIndices',
    value: function calculateIndices(attribute) {
      attribute.value = this.state.polygonTesselator.indices();
      attribute.target = GL.ELEMENT_ARRAY_BUFFER;
      this.state.model.setVertexCount(attribute.value.length / attribute.size);
    }
  }, {
    key: 'calculatePositions',
    value: function calculatePositions(attribute) {
      attribute.value = this.state.polygonTesselator.positions().positions;
    }
  }, {
    key: 'calculatePositionsLow',
    value: function calculatePositionsLow(attribute) {
      attribute.value = this.state.polygonTesselator.positions().positions64xyLow;
    }
  }, {
    key: 'calculateNormals',
    value: function calculateNormals(attribute) {
      attribute.value = this.state.polygonTesselator.normals();
    }
  }, {
    key: 'calculateColors',
    value: function calculateColors(attribute) {
      var _this3 = this;

      attribute.value = this.state.polygonTesselator.colors({
        getColor: function getColor(polygonIndex) {
          return _this3.props.getColor(_this3.props.data[polygonIndex]);
        }
      });
    }

    // Override the default picking colors calculation

  }, {
    key: 'calculatePickingColors',
    value: function calculatePickingColors(attribute) {
      attribute.value = this.state.polygonTesselator.pickingColors();
    }
  }]);

  return SolidPolygonLayer;
}(Layer);

export default SolidPolygonLayer;


SolidPolygonLayer.layerName = 'SolidPolygonLayer';
SolidPolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9zb2xpZC1wb2x5Z29uLWxheWVyL3NvbGlkLXBvbHlnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiTGF5ZXIiLCJnZXQiLCJHTCIsIk1vZGVsIiwiR2VvbWV0cnkiLCJlbmFibGU2NGJpdFN1cHBvcnQiLCJDT09SRElOQVRFX1NZU1RFTSIsIlBvbHlnb25UZXNzZWxhdG9yIiwiUG9seWdvblRlc3NlbGF0b3JFeHRydWRlZCIsInZzIiwidnM2NCIsImZzIiwiZGVmYXVsdFByb3BzIiwiZXh0cnVkZWQiLCJ3aXJlZnJhbWUiLCJmcDY0IiwiZ2V0UG9seWdvbiIsImYiLCJnZXRFbGV2YXRpb24iLCJnZXRDb2xvciIsImxpZ2h0U2V0dGluZ3MiLCJsaWdodHNQb3NpdGlvbiIsImFtYmllbnRSYXRpbyIsImRpZmZ1c2VSYXRpbyIsInNwZWN1bGFyUmF0aW8iLCJsaWdodHNTdHJlbmd0aCIsIm51bWJlck9mTGlnaHRzIiwiU29saWRQb2x5Z29uTGF5ZXIiLCJwcm9wcyIsIm1vZHVsZXMiLCJnbCIsImNvbnRleHQiLCJzZXRTdGF0ZSIsIm1vZGVsIiwiX2dldE1vZGVsIiwibnVtSW5zdGFuY2VzIiwiSW5kZXhUeXBlIiwiZ2V0RXh0ZW5zaW9uIiwiVWludDMyQXJyYXkiLCJVaW50MTZBcnJheSIsImF0dHJpYnV0ZU1hbmFnZXIiLCJzdGF0ZSIsIm5vQWxsb2MiLCJhZGQiLCJpbmRpY2VzIiwic2l6ZSIsImlzSW5kZXhlZCIsInVwZGF0ZSIsImNhbGN1bGF0ZUluZGljZXMiLCJwb3NpdGlvbnMiLCJhY2Nlc3NvciIsImNhbGN1bGF0ZVBvc2l0aW9ucyIsIm5vcm1hbHMiLCJjYWxjdWxhdGVOb3JtYWxzIiwiY29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVDb2xvcnMiLCJwaWNraW5nQ29sb3JzIiwiY2FsY3VsYXRlUGlja2luZ0NvbG9ycyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJpbnZhbGlkYXRlQWxsIiwicHJvamVjdGlvbk1vZGUiLCJMTkdMQVQiLCJwb3NpdGlvbnM2NHh5TG93IiwiY2FsY3VsYXRlUG9zaXRpb25zTG93IiwicmVtb3ZlIiwidW5pZm9ybXMiLCJyZW5kZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJyZWdlbmVyYXRlTW9kZWwiLCJ1cGRhdGVHZW9tZXRyeSIsInVwZGF0ZUF0dHJpYnV0ZSIsImdlb21ldHJ5Q29uZmlnQ2hhbmdlZCIsImRhdGFDaGFuZ2VkIiwicG9seWdvbnMiLCJkYXRhIiwibWFwIiwicG9seWdvblRlc3NlbGF0b3IiLCJnZXRIZWlnaHQiLCJwb2x5Z29uSW5kZXgiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiTElORVMiLCJUUklBTkdMRVMiLCJ2ZXJ0ZXhDb3VudCIsInNoYWRlckNhY2hlIiwiYXR0cmlidXRlIiwidmFsdWUiLCJ0YXJnZXQiLCJFTEVNRU5UX0FSUkFZX0JVRkZFUiIsInNldFZlcnRleENvdW50IiwibGVuZ3RoIiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBUUEsS0FBUixRQUFvQixjQUFwQjtBQUNBLFNBQVFDLEdBQVIsUUFBa0Isb0JBQWxCO0FBQ0EsU0FBUUMsRUFBUixFQUFZQyxLQUFaLEVBQW1CQyxRQUFuQixRQUFrQyxTQUFsQztBQUNBLFNBQVFDLGtCQUFSLFFBQWlDLHlCQUFqQztBQUNBLFNBQVFDLGlCQUFSLFFBQWdDLGNBQWhDOztBQUVBO0FBQ0EsU0FBUUMsaUJBQVIsUUFBZ0Msc0JBQWhDO0FBQ0EsU0FBUUMseUJBQVIsUUFBd0MsK0JBQXhDOztBQUVBLE9BQU9DLEVBQVAsTUFBZSxtQ0FBZjtBQUNBLE9BQU9DLElBQVAsTUFBaUIsc0NBQWpCO0FBQ0EsT0FBT0MsRUFBUCxNQUFlLHFD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S0FBTCxDQUFXdUMsaUJBQVgsQ0FBNkIvQixTQUE3QixHQUF5Q2dCLGdCQUEzRDtBQUNEOzs7cUNBQ2dCMEIsUyxFQUFXO0FBQzFCQSxnQkFBVUMsS0FBVixHQUFrQixLQUFLbkQsS0FBTCxDQUFXdUMsaUJBQVgsQ0FBNkI1QixPQUE3QixFQUFsQjtBQUNEOzs7b0NBRWV1QyxTLEVBQVc7QUFBQTs7QUFDekJBLGdCQUFVQyxLQUFWLEdBQWtCLEtBQUtuRCxLQUFMLENBQVd1QyxpQkFBWCxDQUE2QjFCLE1BQTdCLENBQW9DO0FBQ3BEbkMsa0JBQVU7QUFBQSxpQkFBZ0IsT0FBS1MsS0FBTCxDQUFXVCxRQUFYLENBQW9CLE9BQUtTLEtBQUwsQ0FBV2tELElBQVgsQ0FBZ0JJLFlBQWhCLENBQXBCLENBQWhCO0FBQUE7QUFEMEMsT0FBcEMsQ0FBbEI7QUFHRDs7QUFFRDs7OzsyQ0FDdUJTLFMsRUFBVztBQUNoQ0EsZ0JBQVVDLEtBQVYsR0FBa0IsS0FBS25ELEtBQUwsQ0FBV3VDLGlCQUFYLENBQTZCdEIsYUFBN0IsRUFBbEI7QUFDRDs7OztFQWxJNEMxRCxLOztlQUExQjJCLGlCOzs7QUFxSXJCQSxrQkFBa0JzRSxTQUFsQixHQUE4QixtQkFBOUI7QUFDQXRFLGtCQUFrQmYsWUFBbEIsR0FBaUNBLFlBQWpDIiwiZmlsZSI6InNvbGlkLXBvbHlnb24tbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtMYXllcn0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCB7Z2V0fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7ZW5hYmxlNjRiaXRTdXBwb3J0fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMvZnA2NCc7XG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNfSBmcm9tICcuLi8uLi8uLi9saWInO1xuXG4vLyBQb2x5Z29uIGdlb21ldHJ5IGdlbmVyYXRpb24gaXMgbWFuYWdlZCBieSB0aGUgcG9seWdvbiB0ZXNzZWxhdG9yXG5pbXBvcnQge1BvbHlnb25UZXNzZWxhdG9yfSBmcm9tICcuL3BvbHlnb24tdGVzc2VsYXRvcic7XG5pbXBvcnQge1BvbHlnb25UZXNzZWxhdG9yRXh0cnVkZWR9IGZyb20gJy4vcG9seWdvbi10ZXNzZWxhdG9yLWV4dHJ1ZGVkJztcblxuaW1wb3J0IHZzIGZyb20gJy4vc29saWQtcG9seWdvbi1sYXllci12ZXJ0ZXguZ2xzbCc7XG5pbXBvcnQgdnM2NCBmcm9tICcuL3NvbGlkLXBvbHlnb24tbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuaW1wb3J0IGZzIGZyb20gJy4vc29saWQtcG9seWdvbi1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICAvLyBXaGV0aGVyIHRvIGV4dHJ1ZGVcbiAgZXh0cnVkZWQ6IGZhbHNlLFxuICAvLyBXaGV0aGVyIHRvIGRyYXcgYSBHTC5MSU5FUyB3aXJlZnJhbWUgb2YgdGhlIHBvbHlnb25cbiAgd2lyZWZyYW1lOiBmYWxzZSxcbiAgZnA2NDogZmFsc2UsXG5cbiAgLy8gQWNjZXNzb3IgZm9yIHBvbHlnb24gZ2VvbWV0cnlcbiAgZ2V0UG9seWdvbjogZiA9PiBnZXQoZiwgJ3BvbHlnb24nKSB8fCBnZXQoZiwgJ2dlb21ldHJ5LmNvb3JkaW5hdGVzJyksXG4gIC8vIEFjY2Vzc29yIGZvciBleHRydXNpb24gaGVpZ2h0XG4gIGdldEVsZXZhdGlvbjogZiA9PiBnZXQoZiwgJ2VsZXZhdGlvbicpIHx8IGdldChmLCAncHJvcGVydGllcy5oZWlnaHQnKSB8fCAwLFxuICAvLyBBY2Nlc3NvciBmb3IgY29sb3JcbiAgZ2V0Q29sb3I6IGYgPT4gZ2V0KGYsICdjb2xvcicpIHx8IGdldChmLCAncHJvcGVydGllcy5jb2xvcicpLFxuXG4gIC8vIE9wdGlvbmFsIHNldHRpbmdzIGZvciAnbGlnaHRpbmcnIHNoYWRlciBtb2R1bGVcbiAgbGlnaHRTZXR0aW5nczoge1xuICAgIGxpZ2h0c1Bvc2l0aW9uOiBbLTEyMi40NSwgMzcuNzUsIDgwMDAsIC0xMjIuMCwgMzguMDAsIDUwMDBdLFxuICAgIGFtYmllbnRSYXRpbzogMC4wNSxcbiAgICBkaWZmdXNlUmF0aW86IDAuNixcbiAgICBzcGVjdWxhclJhdGlvOiAwLjgsXG4gICAgbGlnaHRzU3RyZW5ndGg6IFsyLjAsIDAuMCwgMC4wLCAwLjBdLFxuICAgIG51bWJlck9mTGlnaHRzOiAyXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNvbGlkUG9seWdvbkxheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcykgP1xuICAgICAge3ZzOiB2czY0LCBmcywgbW9kdWxlczogWydwcm9qZWN0NjQnLCAnbGlnaHRpbmcnXX0gOlxuICAgICAge3ZzLCBmcywgbW9kdWxlczogWydsaWdodGluZyddfTsgLy8gJ3Byb2plY3QnIG1vZHVsZSBhZGRlZCBieSBkZWZhdWx0LlxuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBtb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpLFxuICAgICAgbnVtSW5zdGFuY2VzOiAwLFxuICAgICAgSW5kZXhUeXBlOiBnbC5nZXRFeHRlbnNpb24oJ09FU19lbGVtZW50X2luZGV4X3VpbnQnKSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXlcbiAgICB9KTtcblxuICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qgbm9BbGxvYyA9IHRydWU7XG4gICAgLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkKHtcbiAgICAgIGluZGljZXM6IHtzaXplOiAxLCBpc0luZGV4ZWQ6IHRydWUsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbmRpY2VzLCBub0FsbG9jfSxcbiAgICAgIHBvc2l0aW9uczoge3NpemU6IDMsIGFjY2Vzc29yOiAnZ2V0RWxldmF0aW9uJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVBvc2l0aW9ucywgbm9BbGxvY30sXG4gICAgICBub3JtYWxzOiB7c2l6ZTogMywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZU5vcm1hbHMsIG5vQWxsb2N9LFxuICAgICAgY29sb3JzOiB7c2l6ZTogNCwgdHlwZTogR0wuVU5TSUdORURfQllURSwgYWNjZXNzb3I6ICdnZXRDb2xvcicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVDb2xvcnMsIG5vQWxsb2N9LFxuICAgICAgcGlja2luZ0NvbG9yczoge3NpemU6IDMsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVQaWNraW5nQ29sb3JzLCBub0FsbG9jfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICB9XG5cbiAgdXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG5cbiAgICAgIGlmIChwcm9wcy5mcDY0ICYmIHByb3BzLnByb2plY3Rpb25Nb2RlID09PSBDT09SRElOQVRFX1NZU1RFTS5MTkdMQVQpIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5hZGQoe1xuICAgICAgICAgIHBvc2l0aW9uczY0eHlMb3c6IHtzaXplOiAyLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUG9zaXRpb25zTG93fVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFtcbiAgICAgICAgICAncG9zaXRpb25zNjR4eUxvdydcbiAgICAgICAgXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgY29uc3Qge2V4dHJ1ZGVkLCBsaWdodFNldHRpbmdzfSA9IHRoaXMucHJvcHM7XG5cbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcihPYmplY3QuYXNzaWduKHt9LCB1bmlmb3Jtcywge1xuICAgICAgZXh0cnVkZWQ6IGV4dHJ1ZGVkID8gMS4wIDogMC4wXG4gICAgfSxcbiAgICBsaWdodFNldHRpbmdzKSk7XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuXG4gICAgY29uc3QgcmVnZW5lcmF0ZU1vZGVsID0gdGhpcy51cGRhdGVHZW9tZXRyeSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuXG4gICAgaWYgKHJlZ2VuZXJhdGVNb2RlbCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgfVxuXG4gIHVwZGF0ZUdlb21ldHJ5KHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGNvbnN0IGdlb21ldHJ5Q29uZmlnQ2hhbmdlZCA9IHByb3BzLmV4dHJ1ZGVkICE9PSBvbGRQcm9wcy5leHRydWRlZCB8fFxuICAgICAgcHJvcHMud2lyZWZyYW1lICE9PSBvbGRQcm9wcy53aXJlZnJhbWUgfHwgcHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NDtcblxuICAgICAvLyBXaGVuIHRoZSBnZW9tZXRyeSBjb25maWcgIG9yIHRoZSBkYXRhIGlzIGNoYW5nZWQsXG4gICAgIC8vIHRlc3NlbGxhdG9yIG5lZWRzIHRvIGJlIGludm9rZWRcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQgfHwgZ2VvbWV0cnlDb25maWdDaGFuZ2VkKSB7XG4gICAgICBjb25zdCB7Z2V0UG9seWdvbiwgZXh0cnVkZWQsIHdpcmVmcmFtZSwgZ2V0RWxldmF0aW9ufSA9IHByb3BzO1xuXG4gICAgICAvLyBUT0RPIC0gYXZvaWQgY3JlYXRpbmcgYSB0ZW1wb3JhcnkgYXJyYXkgaGVyZTogbGV0IHRoZSB0ZXNzZWxhdG9yIGl0ZXJhdGVcbiAgICAgIGNvbnN0IHBvbHlnb25zID0gcHJvcHMuZGF0YS5tYXAoZ2V0UG9seWdvbik7XG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBwb2x5Z29uVGVzc2VsYXRvcjogIWV4dHJ1ZGVkID9cbiAgICAgICAgICBuZXcgUG9seWdvblRlc3NlbGF0b3Ioe3BvbHlnb25zLCBmcDY0OiB0aGlzLnByb3BzLmZwNjR9KSA6XG4gICAgICAgICAgbmV3IFBvbHlnb25UZXNzZWxhdG9yRXh0cnVkZWQoe3BvbHlnb25zLCB3aXJlZnJhbWUsXG4gICAgICAgICAgICBnZXRIZWlnaHQ6IHBvbHlnb25JbmRleCA9PiBnZXRFbGV2YXRpb24odGhpcy5wcm9wcy5kYXRhW3BvbHlnb25JbmRleF0pLFxuICAgICAgICAgICAgZnA2NDogdGhpcy5wcm9wcy5mcDY0XG4gICAgICAgICAgfSlcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnN0YXRlLmF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuICAgIH1cblxuICAgIHJldHVybiBnZW9tZXRyeUNvbmZpZ0NoYW5nZWQ7XG4gIH1cblxuICBfZ2V0TW9kZWwoZ2wpIHtcbiAgICByZXR1cm4gbmV3IE1vZGVsKGdsLCBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFNoYWRlcnMoKSwge1xuICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgZHJhd01vZGU6IHRoaXMucHJvcHMud2lyZWZyYW1lID8gR0wuTElORVMgOiBHTC5UUklBTkdMRVNcbiAgICAgIH0pLFxuICAgICAgdmVydGV4Q291bnQ6IDAsXG4gICAgICBpc0luZGV4ZWQ6IHRydWUsXG4gICAgICBzaGFkZXJDYWNoZTogdGhpcy5jb250ZXh0LnNoYWRlckNhY2hlXG4gICAgfSkpO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5kaWNlcyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLmluZGljZXMoKTtcbiAgICBhdHRyaWJ1dGUudGFyZ2V0ID0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVI7XG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5zZXRWZXJ0ZXhDb3VudChhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemUpO1xuICB9XG5cbiAgY2FsY3VsYXRlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IucG9zaXRpb25zKCkucG9zaXRpb25zO1xuICB9XG4gIGNhbGN1bGF0ZVBvc2l0aW9uc0xvdyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLnBvc2l0aW9ucygpLnBvc2l0aW9uczY0eHlMb3c7XG4gIH1cbiAgY2FsY3VsYXRlTm9ybWFscyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLm5vcm1hbHMoKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLmNvbG9ycyh7XG4gICAgICBnZXRDb2xvcjogcG9seWdvbkluZGV4ID0+IHRoaXMucHJvcHMuZ2V0Q29sb3IodGhpcy5wcm9wcy5kYXRhW3BvbHlnb25JbmRleF0pXG4gICAgfSk7XG4gIH1cblxuICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBwaWNraW5nIGNvbG9ycyBjYWxjdWxhdGlvblxuICBjYWxjdWxhdGVQaWNraW5nQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IucGlja2luZ0NvbG9ycygpO1xuICB9XG59XG5cblNvbGlkUG9seWdvbkxheWVyLmxheWVyTmFtZSA9ICdTb2xpZFBvbHlnb25MYXllcic7XG5Tb2xpZFBvbHlnb25MYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=