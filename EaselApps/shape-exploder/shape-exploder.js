    var makerjs = require('makerjs');
    var meapi = require('makerjs-easel-api');
    var selectedVolumes;
    var timeout = null;
    
    var getSelectedVolumes = function(volumes, selectedVolumeIds) {
      var selectedVolumes = [];
      var volume;
      for (var i = 0; i < volumes.length; i++) {
        volume = volumes[i];
        if (selectedVolumeIds.indexOf(volume.id) !== -1) {
          selectedVolumes.push(volume);
        }
      }
      return selectedVolumes;
    };
    
    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = function(args) {
      selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      
      var props = [
      ];
    
      return props;
    };


    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        executor2(args, success, failure);
      }, 500);
    }
    
    var executor2 = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      var volumes = [];
      
      
      var easelModel = selectedVolumes[0].shape;
      var makerModel = meapi.importEaselShape(easelModel);
      var measurementPath = makerjs.measure.modelExtents(makerModel);
      
      var svgmodels = {models: {}};
      var modelitr = 0;
      var chains = makerjs.model.findChains(makerModel);
      var modelarr = [];
      for (var ch in chains) {
        var chain = chains[ch];
        var isClockwise = makerjs.measure.isChainClockwise(chain);
        var nmodel = makerjs.chain.toNewModel(chain);
        var nmodelext = makerjs.measure.modelExtents(nmodel);
        modelarr.push({
          model: nmodel,
          cut: {type: "fill", depth: (isClockwise ? 0 : args.volumes[0].cut.depth)},
          area: (nmodelext.height * nmodelext.width)
        });
        modelitr++;
      }
      
      // Arrows don't work in IE11
      //modelarr.sort((a,b) => (a.area > b.area) ? -1 : ((b.area > a.area) ? 1 : 0)); 
      modelarr.sort(function (a, b) {
        return a.area > b.area ? -1 : b.area > a.area ? 1 : 0;
      });

      for (var i = 0; i < modelarr.length; i++) {
        svgmodels.models[i] = {
          model: modelarr[i].model,
          cut: modelarr[i].cut
        };
      }
      
      for (var key in svgmodels.models) {
        var measurement = makerjs.measure.modelExtents(svgmodels.models[key].model);
        var allPoints = meapi.exportModelToEaselPointArray(svgmodels.models[key].model);
        var volume = {
          shape: {
            type: "path",
            points: allPoints,
            flipping: {},
            center: {
              x: measurement.center[0] + easelModel.center.x - measurementPath.width / 2,
              y: measurement.center[1] + easelModel.center.y - measurementPath.height / 2
            },
            width: measurement.width,
            height: measurement.height,
            rotation: 0
          }
        }; 
        volume.cut = svgmodels.models[key].cut;
        volumes.push(volume);
      }
      
      var deletevolume = {}
      deletevolume.id = selectedVolumes[0].id;
      volumes.push(deletevolume);
      
      success(volumes);
    };
