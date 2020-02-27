    /*
    // For Development
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps@master/EaselApps/_helpers/paper-full.min.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps@master/EaselApps/_helpers/paper-easel-api.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps@master/EaselApps/_helpers/PaperPathWarp.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps@master/EaselApps/_helpers/easel-mod.js');
    */
    
    paper.install(this);
    paper.setup([100, 100]);
    
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
        //{type: "boolean", id: "Remove Original", value: true}
        {type: "boolean", id: "Remove Top Volume", value: true}
      ];
      
      return props;
    };

    var executor = function(args, success, failure) {
      self.failure = failure;
      var params = args.params;
      var material = args.material;
      var allvolumes = args.volumes;
      var volumes = [];
      
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      if(selectedVolumes.length < 2) {failure("Please select at least 2 shapes."); return false;}
      
      GeneratePaperPaths(selectedVolumes);
      
      var intersectvol = selectedVolumes.pop();
      var intersectvols = [];
      
      if(intersectvol.shape.type == "line" ) {failure("Lines are not supported."); return false;}
      if(intersectvol.shape.type == "drill" ) {failure("Drills are not supported."); return false;}
      if(intersectvol.shape.type == "text" ) {failure("Text elements are not supported."); return false;}
      
      selectedVolumes.forEach(function(vol){
        if(vol.shape.type == "line" ) {failure("Lines are not supported."); return false;}
        if(vol.shape.type == "drill" ) {failure("Drills are not supported."); return false;}
        if(vol.shape.type == "text" ) {failure("Text elements are not supported."); return false;}
        var intersect = intersectvol.PaperPath.intersect(vol.PaperPath).clone();
        if((intersect.className == "Path" || intersect.className == "CompoundPath") && intersect.pathData !== "") {
          var volclone = JSON.parse(JSON.stringify(vol));
          volclone.PaperPath = intersect;
          volclone.id = null;
          intersectvols.push(volclone);
        }
      });
      PaperToEasel(intersectvols);
      
      if(intersectvols.length === 0) { failure("There were no intersections found between the top shape and any other selected shape."); return false; }
      
      // Remove all original volumes
      //if(params["Remove Original"]) {
      if(true){
        if(params["Remove Top Volume"]) {
          selectedVolumes.push(intersectvol);
        } else {
          intersectvols.unshift(intersectvol);
        }
        selectedVolumes.forEach(function(vol){
          delete vol.PaperPath;
          delete vol.shape;
          delete vol.cut;
          intersectvols.push(vol);
        });
      }
      
      intersectvols.forEach(function(vol){
        delete vol.PaperPath;
      });
      
      success(intersectvols);
    }
