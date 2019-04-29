    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = [
      {type: 'boolean', id: "Adjust all Circles", value: false},
      {type: 'range', id: "Original Diameter", value: 1, min: 1, max: 10, step: 0.001},
      {type: 'range', id: "Diamter Tolerance ±", value: 0, min: 0, max: 10, step: 0.001},
      {type: 'list', id: "Resize Type", value: "Offset", options: ["Offset", "Specify"]},
      {type: 'range', id: "Resize Value", value: 0, min: -10, max: 10, step: 0.001}
    ];
    
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
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      
      var volumes = selectedVolumes;
      if (selectedVolumes === undefined || selectedVolumes.length === 0) {
        volumes = args.volumes;
      }
      
      if (volumes === undefined || volumes.length === 0) {
        failure("No shapes in current design.");
        return false;
      }
      
      var i = volumes.length
      while (i--) {
          if (volumes[i].shape.type != "ellipse") { 
              volumes.splice(i, 1);
          } else if(volumes[i].shape.width != volumes[i].shape.height) {
            volumes.splice(i, 1);
          }
      }
      
      if (volumes === undefined || volumes.length === 0) {
        failure("No circles in current design. (Ellipses cannot be resized).");
        return false;
      }
      
      if(params["Adjust all Circles"] === false) {
        i = volumes.length;
        while (i--) {
          if (volumes[i].shape.width < (params["Original Diameter"] - params["Diamter Tolerance ±"])) { 
              volumes.splice(i, 1);
          } else if(volumes[i].shape.width > (params["Original Diameter"] + params["Diamter Tolerance ±"])) {
            volumes.splice(i, 1);
          }
        }
        
        if (volumes === undefined || volumes.length === 0) {
          failure("No circles found that fit the specified parameters.");
          return false;
        }
      }
      
      if(params["Resize Type"] == "Offset") {
        i = volumes.length;
        while (i--) {
          volumes[i].shape.width += params["Resize Value"];
          volumes[i].shape.height = volumes[i].shape.width;
        }
      } else {
        i = volumes.length;
        while (i--) {
          volumes[i].shape.width = params["Resize Value"];
          volumes[i].shape.height = volumes[i].shape.width;
        }
      }
      
      i = volumes.length;
      while (i--) {
        if(volumes[i].shape.width <= 0) {
          failure("Circle size becomes less than 0, cannot perform resize.");
          return false;
        }
      }
      
      console.log(volumes);
      success(volumes);
    };
