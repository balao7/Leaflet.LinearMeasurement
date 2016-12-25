(function(){

    L.Class.MeasurementFeature = L.Class.LineFeature.extend({

        options: {
          name: 'ruler',
          unitSystem: 'imperial' // imperial | metric
        },

        initialize: function (core) {
            L.Class.LineFeature.prototype.initialize.call(this, core);
            this.resetRuler();
        },

        onClick: function(e){
            if(L.DomUtil.hasClass(e.originalEvent.target, 'icon-ruler')){
                return;
            }

            L.Class.LineFeature.prototype.onClick.call(this, e);
        },

        onMove: function(e, layer){
            L.Class.LineFeature.prototype.onMove.call(this, e, layer);
            this.drawRulerLines(layer, e);
        },

        onDblClick: function(e){
            this.fixMeasurements(this.core.layer);

            var latlngs = this.latlngs,
                sum = 0,
                prev,
                o;

            this.core.layer.options.title = this.measure.scalar + ' ' + this.measure.unit;

            L.Class.LineFeature.prototype.onDblClick.call(this, e);
        },

        drawRulerLines: function(layer, e){
            if(!this.latlngs.length){
              return;
            }

            var latlngs = this.latlngs.concat([e.latlng]),
                prev,
                total = 0,
                dimension = 0;

            total = this.getStaticSum(latlngs);
            this.cleanUpTmp(layer);

            if(latlngs.length > 1){

                for(var s in latlngs){

                    if(prev) {
                        dimension += this.displayMarkers.apply(this, [[prev, latlngs[s]], true, dimension, layer, total]);
                    }

                    prev = latlngs[s];
                }
            }
        },

        displayMarkers: function(latlngs, multi, sum, layer, total) {

            var x, y, label, ratio, p,
                latlng = latlngs[1],
                prevLatlng = latlngs[0],
                original = prevLatlng.distanceTo(latlng)/this.UNIT_CONV,
                dis = original,
                measure = layer.measure || this.measure;

            var p2 = this.core._map.latLngToContainerPoint(latlng),
                p1 = this.core._map.latLngToContainerPoint(prevLatlng),
                unit = 1,
                n, m, sep_total = total, sep;

            if(total > 1){
                measure.unit = 'mi';

            } else {
                measure.unit = 'ft';
                sep_total = this.SUB_UNIT_CONV * total;
            }

            sep = this.getSeparation(sep_total);

            measure.scalar = sep_total.toFixed(2);

            if(measure.unit === this.SUB_UNIT){
                unit = this.SUB_UNIT_CONV;
                dis = dis * unit;
            }

            var t = (sum * unit) + dis,
                qu = sum * unit,
                un = measure.unit;

            for(var q = Math.floor(qu); q < t; q++){
                ratio = (t-q) / dis;

                if(q % sep || q < qu) {
                    continue;
                }

                x = (p2.x - ratio * (p2.x - p1.x));
                y = (p2.y - ratio * (p2.y - p1.y));

                p = L.point(x, y);

                /* render a circle spaced by separation */

                latlng = this.core._map.containerPointToLatLng(p);

                label = (q + ' ' + un);

                if(q) {
                    this.renderCircle(latlng, layer, 'tmp', label, false, false);
                }

                this.last = t;
            }

            return original;
        },

        getSeparation: function(total){
            var sep, n, m;

            n = (parseInt(total)+'').length;
            m = Math.pow(10, n);
            sep = m/10;
            if((sep * 5) > total){
              sep = parseInt(sep / 5);
            }

            return sep;
        },

        getStaticSum: function(latLngs){
            var sum = 0;

            if(latLngs.length){
                if(latLngs[0].length){
                    for(var s in latLngs){
                      sum += this.countLine(latLngs[s]);
                    }
                } else {
                    sum = this.countLine(latLngs);
                }

            } else {
                sum = this.sum;
            }
            return sum;
        },

        countLine: function(latLngs){
          var o, sum = 0, prev;
          for(var l in latLngs){
              o = latLngs[l];

              if(prev){
                  sum += prev.distanceTo(o)/this.UNIT_CONV;
              }

              prev = latLngs[l];
          }

          return sum;
        },

        resetRuler: function(){
            this.sum = 0;
            this.distance = 0;
            this.separation = 1;
            this.last = 0;
            this.fixedLast = 0;
            this.totalIcon = null;
            this.total = null;
            this.lastCircle = null;

            /* Leaflet return distances in meters */
            this.UNIT_CONV = 1000;
            this.SUB_UNIT_CONV = 1000;
            this.UNIT = 'km';
            this.SUB_UNIT = 'm';

            if(this.options.unitSystem === 'imperial'){
                this.UNIT_CONV = 1609.344;
                this.SUB_UNIT_CONV = 5280;
                this.UNIT = 'mi';
                this.SUB_UNIT = 'ft';
            }

            this.measure = {
                scalar: 0,
                unit: this.SUB_UNIT
            };
        },

        clearAll: function(layer){
            if(layer){
                layer.eachLayer(function(l){
                    if(l.options && l.options.type === 'tmp' || l.options.type === 'fixed'){
                        layer.removeLayer(l);
                    }
                });
            }
        },

        cleanUpTmp: function(layer){
          if(layer){
              layer.eachLayer(function(l){
                  if(l.options && l.options.type === 'tmp'){
                      layer.removeLayer(l);
                  }
              });
          }
        },

        fixMeasurements: function(layer){
          if(layer){
              layer.eachLayer(function(l){
                  if(l.options.type === 'tmp'){
                      l.options.type = 'fixed';
                  }
              });
          }
        }

    });

})();
