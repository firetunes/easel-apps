    var timeout = null;
    var targetVolume;
    
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
      var material = args.material;
      var materialHeight = material.dimensions.z;
      
      var props = [
        {type: 'range', id: "Start Depth", value: 0, min: 0, max: materialHeight, step: 0.001},
        {type: 'range', id: "Gradient Depth", value: 0.25, min: 0, max: materialHeight, step: 0.001},
        {type: 'range', id: "Gradient Length", value: 0.25, min: 0, max: 1, step: 0.001},
        {type: 'range', id: "Steps", value: 20, min: 1, max: 100, step: 1},
        {type: 'boolean', id: "Flip", value: false},
        {type: 'range', id: "Bezier_P1", value: 0, min: 0, max: 1, step: 0.01},
        {type: 'range', id: "Bezier_P2", value: 0, min: -2, max: 2, step: 0.01},
        {type: 'range', id: "Bezier_P3", value: 1, min: 0, max: 1, step: 0.01},
        {type: 'range', id: "Bezier_P4", value: 1, min: -2, max: 2, step: 0.01}
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
    
    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor2 = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      var volumes = [];
      
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      if(selectedVolumes.length > 1) {failure("Please select only 1 shape."); return false;}
      
      var i;
      var startDepth = params["Start Depth"];
      var GLength = params["Gradient Length"];
      var GDepth  = params["Gradient Depth"];
      var Flip    = params["Flip"];
      var Steps   = params["Steps"];
      var easing = BezierEasing(params["Bezier_P1"], params["Bezier_P2"], params["Bezier_P3"], params["Bezier_P4"]);
      
      //var curVolDepth = selectedVolumes[0].cut.depth;
      var StepOffset = GLength / Steps;
      
      if(!Flip && (startDepth + GDepth) > material.dimensions.z) { 
        // GDepth to large 
        failure("Gradient Depth is to large. Max depth at given start depth and material thickness is: " + (material.dimensions.z - startDepth).toString());
        return false;
      }
      
      if(Flip && (startDepth - GDepth) < 0) {
        // GDepth to large
        failure("Gradient Depth is to large. Max depth at given start depth is: " + (startDepth).toString());
        return false;
      }
      
      //var startDepth = (Flip ? curVolDepth: (curVolDepth - GDepth));
      
      var cutObj = { depth: startDepth, type: 'fill', outlineStyle: 'on-path', tabPreference: false };
      
      var Vol0 = EASEL.volumeHelper.expand([selectedVolumes[0]], (0));
      Vol0.cut = JSON.parse(JSON.stringify(cutObj));
      Vol0.cut.depth = startDepth;
      volumes.push(Vol0);
      
      
      
      var curr_depth = startDepth;
      for( i = 0; i < Steps; i += 1 ) {
        var bezier_in = (i) / Steps;
        var bezier_out = easing(bezier_in);
        
        var stepDepth = startDepth + GDepth * bezier_out * (Flip ? -1 : 1);
        
        console.log([i, Steps, startDepth, stepDepth, GDepth, bezier_out]);
        var stepVol = EASEL.volumeHelper.expand([Vol0], -1 * (StepOffset * (i + 1)));
        stepVol.cut = JSON.parse(JSON.stringify(cutObj));
        stepVol.cut.depth = stepDepth;
        
        volumes.push(stepVol);
      }

      success(volumes);
    };
