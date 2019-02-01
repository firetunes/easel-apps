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
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      targetVolume = selectedVolumes[0];
      
      var props = [
        {type: 'range', id: "V-Bit Angle", value: 60, min:30, max:90, step:5},
        {type: 'range', id: "Glue Depth", value: materialHeight * 0.1, min:0, max:material.dimensions.z*0.2, step:material.dimensions.z * 0.01},
        {type: 'range', id: "Flat Depth", value: materialHeight * 0.1, min:0, max:material.dimensions.z*0.2, step:material.dimensions.z * 0.01},
        {type: 'range', id: "Glue Sub-Divisions", value: 5, min: 1, max: 20}
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
      
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      if(selectedVolumes.length > 1) {failure("Please select only 1 shape."); return false;}
      
      var cutObj = { depth: 0, type: 'fill', outlineStyle: 'on-path', tabPreference: false };
      var Vol0 = {shape: { type: 'rectangle', center: JSON.parse(JSON.stringify(targetVolume.shape.center)), width: targetVolume.shape.width * 2, height:  targetVolume.shape.height * 2, flipping: {}, rotation: 0 }};
      var Vol1 = EASEL.volumeHelper.expand([targetVolume], (Math.tan(params["V-Bit Angle"] / 2 * Math.PI / 180) * params["Flat Depth"]));
      var Vol2 = EASEL.volumeHelper.expand([targetVolume], (0));
      Vol0.cut = JSON.parse(JSON.stringify(cutObj));
      Vol1.cut = JSON.parse(JSON.stringify(cutObj));
      Vol2.cut = JSON.parse(JSON.stringify(cutObj));
      Vol0.cut.depth = params["Glue Depth"] + params["Flat Depth"];
      Vol1.cut.depth = params["Glue Depth"] + params["Flat Depth"];
      Vol2.cut.depth = params["Glue Depth"];
      
      volumes.push(Vol0);
      volumes.push(Vol1);
      volumes.push(Vol2);
      
      var divisions = Math.min(Math.max(params["Glue Sub-Divisions"], 1),20);
      var divisionoffset = (Math.tan(params["V-Bit Angle"] / 2 * Math.PI / 180) * params["Glue Depth"] * -1) / divisions;
      
      for( var i = 1; i <= divisions; i++) {
        var Vol3 = EASEL.volumeHelper.expand([targetVolume], (divisionoffset * i));
        Vol3.cut = JSON.parse(JSON.stringify(cutObj));
        Vol3.cut.depth =  params["Glue Depth"] - (params["Glue Depth"] / divisions) * i;
        volumes.push(Vol3);
      }
      
      success(volumes);
    };
