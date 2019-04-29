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
        {type: 'list', id: "Start Point", value: "Default", options: ["Default", "Left", "Top", "Right", "Bottom"]},
        {type: 'range', id: "Start at {x}%", value: 0, min: 0, max: 100, step: 0.1},
        {type: 'range', id: "End at {x}%", value: 100, min: 0, max: 100, step: 0.1},
        {type: 'boolean', id: "Reverse", value: false}
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
      var LeftStart = params["Start at {x}%"];
      var RightStart = params["End at {x}%"];
      var divisions = 1000;
      var volumes = [];
      
      var MinLen = Math.round(divisions / 10000 * 3 * 10) / 10;
      if(RightStart < (LeftStart + MinLen)) {
        failure("Right Offset must be greater than left offset by " + (MinLen).toString());
        return false;
      }
      
      if(selectedVolumes.length > 1) {
        failure("Please select only 1 volume.");
        return false;
      }
      
      if(selectedVolumes[0].shape.type == "drill") {
        failure("Cannot extract subpath from drill point.");
        return false;
      }
      
      var easelPath = selectedVolumes[0].shape;
      var makerPath = meapi.importEaselShape(easelPath);
      var measurementPath = makerjs.measure.modelExtents(makerPath);
      var pathchain = makerjs.model.findSingleChain(makerPath);
      if(params["Reverse"]) { makerjs.chain.reverse(pathchain); }
      //makerjs.chain.cycle(pathchain, params["Cycle"]);
      
      var i; var j;
      var points = makerjs.chain.toPoints(pathchain, pathchain.pathLength / divisions);
      if(params["Start Point"] != "Default") {
        var xvalues = points.map(function(elt) { return elt[0]; });
        var yvalues = points.map(function(elt) { return elt[1]; });
        
        var x_max = Math.max.apply(null, xvalues);
        var x_min = Math.min.apply(null, xvalues);
        var y_max = Math.max.apply(null, yvalues);
        var y_min = Math.min.apply(null, yvalues);
        
        var shifting = true;
        while (shifting) {
          switch(params["Start Point"]) {
            case "Left":
              if(points[0][0] == x_min) { shifting = false; }
              break;
            case "Top":
              if(points[0][1] == y_max) { shifting = false; }
              break;
            case "Right":
              if(points[0][0] == x_max) { shifting = false; }
              break;
            case "Bottom":
              if(points[0][1] == y_min) { shifting = false; }
              break;
            default:
              shifting = false;
          }
          if(shifting) { points.push(points.shift()); }
        }
      }
      makerjs.chain.reverse(pathchain);
      var lastpoints = makerjs.chain.toPoints(pathchain, pathchain.pathLength);
      points.push(lastpoints[0]);
      makerjs.chain.reverse(pathchain);
  
      var textpoints = [];
      if(LeftStart > RightStart) {RightStart = LeftStart;}
      for(i = LeftStart * 10; i < RightStart * 10; i++) {
        textpoints.push(points[i]);
      }
      var textcurve = new makerjs.models.ConnectTheDots(false, textpoints);
      var newchain = makerjs.model.findSingleChain(textcurve);
      var chainmodel = makerjs.chain.toNewModel(newchain);
      
      var svgmodels = {models: {}};
      svgmodels.models.curve = {
        model: chainmodel,
        cut: {type: "outline", outlineStyle: "on-path", depth: selectedVolumes[0].cut.depth},
        origin: [0,0]
      };
      
      for (var key in svgmodels.models) {
        var measurement = makerjs.measure.modelExtents(svgmodels.models[key].model);
        var allPoints = meapi.exportModelToEaselPointArray(svgmodels.models[key].model);
        
        // point reduction
        var newPoints = [];
        newPoints.push(allPoints[0][0]);
        
        //var PrevSlope = null;
        for(var i = 1; i < allPoints[0].length - 1; i++) {
          var slopeprev = GetSlope(allPoints[0][i-1],allPoints[0][i]);
          var slopenext = GetSlope(allPoints[0][i],allPoints[0][i+1]);
          if(Math.abs(slopeprev - slopenext) > 0.000000001) {
            newPoints.push(allPoints[0][i]);
          }
        }
        newPoints.push(allPoints[0][allPoints[0].length - 1]);
        allPoints = [newPoints];
        
        var volume = {
          shape: {
            type: "path",
            points: allPoints,
            flipping: {},
            center: {
              x: measurement.center[0] + easelPath.center.x - measurementPath.width / 2,
              y: measurement.center[1] + easelPath.center.y - measurementPath.height / 2
            },
            width: measurement.width,
            height: measurement.height,
            rotation: 0
          }
        }; 
        volume.cut = svgmodels.models[key].cut;
        volumes.push(volume);
      }
      
      success(volumes);
    };
    
    function GetSlope(P1, P2) {
      if(P2.x == P1.x) {return Number.POSITIVE_INFINITY;}
      var m = (P2.y - P1.y) / (P2.x - P1.x);
      return m;
    }
