    // https://github.com/Sillergeoduck/TEXT_warp/blob/master/path-warp.js
    
    var makerjs = require('makerjs');
    var meapi = require('makerjs-easel-api');
    
    
    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = [
      {type: 'list', id: "Warp Type", value: "WARP_ARC", options: ["WARP_ARC", "WARP_ARC_LOWER", "WARP_ARC_UPPER", "WARP_ARCH", "WARP_BULGE", "WARP_FLAG", "WARP_FISH", "WARP_INFLATE", "WARP_SQUEEZE", "WARP_WAVE_LOWER", "WARP_WAVE_UPPER"]},
      {type: 'range', id: "Bend", value: 0, min: -100, max: 100, step: 1},
      {type: 'range', id: "Horizontal Distort", value: 0, min: -100, max: 100, step: 1},
      {type: 'range', id: "Vertical Distort", value: 0, min: -100, max: 100, step: 1}
    ];
    
    function changePath(base_d, arc_type, bend_control, horizontal_control, vertical_control) {
			var p = new Path(base_d);
			p.warp({
				type: arc_type,
				bend : (bend_control / 100) || 0,
				distortV : (horizontal_control / 100) || 0,
				distortH : (vertical_control / 100) || 0,
			});
			return p.output();
		}
    
    var getSelectedVolumes = function(volumes, selectedVolumeIds) {
      var selectedVolumes = [];
      var volume;
      for (i = 0; i < volumes.length; i++) {
        volume = volumes[i];
        if (selectedVolumeIds.indexOf(volume.id) !== -1) {
          selectedVolumes.push(volume);
        }
      }
      return selectedVolumes;
    };
    
    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      var volumes = [];
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      
      if(selectedVolumes.length > 1) {
        failure("Please select 1 shape only.");
        return false;
      }
      
      var easelPath = selectedVolumes[0].shape;
      // Has issues with single lines... idk why.... code below fixes issue.
      if(easelPath.type === "path" && easelPath.points[0].length === 2) {
        if(Object.keys(easelPath.points[0][0]).length === 2 && Object.keys(easelPath.points[0][1]).length === 2) {
          var newpointarr = [];
          newpointarr.push({x: easelPath.points[0][0].x, y: easelPath.points[0][0].y});
          newpointarr.push({x: (easelPath.points[0][0].x + easelPath.points[0][1].x) / 2, y: (easelPath.points[0][0].y + easelPath.points[0][1].y) / 2});
          newpointarr.push({x: easelPath.points[0][1].x, y: easelPath.points[0][1].y});
          easelPath.points[0] = newpointarr;
        }
      }
      
      if(easelPath.type === "text") {
        failure("Does not work with text elements, please convert to shape first.");
        return false;
      }
      
      var makerPath = meapi.importEaselShape(easelPath);
      var svgPath = makerjs.exporter.toSVG(makerPath);
      var warped = changePath(svgPath, params["Warp Type"], params["Bend"], params["Horizontal Distort"], params["Vertical Distort"]);
      
      var cPoints = EASEL.pathToControlPoints(EASEL.pathStringParser.parse(warped));
      var pathVolume = EASEL.pathUtils.fromPointArrays(cPoints);
      var PathBB = EASEL.volumeHelper.boundingBox([pathVolume]);
      
      var cutObj = { depth: material.dimensions.z, type: 'fill', outlineStyle: 'on-path', tabPreference: false };
      
      pathVolume.shape.flipping = {vertical: true, horizontal: false};
      pathVolume.shape.center.x = (PathBB.width) / 2;
      pathVolume.shape.center.y = (PathBB.height) / 2;
      
      pathVolume.cut = cutObj;
      volumes.push(pathVolume);

      success(volumes);
    };
