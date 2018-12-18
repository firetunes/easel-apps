    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    
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
    
    var properties = function(args) {
      var material = args.material;
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      var maxDepth = Math.max.apply(Math, selectedVolumes.map(function(o) { return o.cut.depth; }));
      var minDepth = Math.min.apply(Math, selectedVolumes.map(function(o) { return o.cut.depth; }));
      var materialHeight = material.dimensions.z;
      var maxRaise = minDepth;
      var maxLower = (materialHeight - maxDepth) * -1;
      
      var props = [{
        type: 'range', 
        id: "Offset", 
        value: 0, 
        min: maxLower, 
        max: maxRaise, 
        step: 0.001
      }];
      
      return props;
    };
    
    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      var offset = params.Offset;
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      for (var i = 0; i < selectedVolumes.length; i++) {
        selectedVolumes[i].cut.depth -= offset;
        if(selectedVolumes[i].cut.depth < 0) {selectedVolumes[i].cut.depth = 0;}
      }
      success(args.volumes);
      
    };
