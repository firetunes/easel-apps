   importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps@master/EaselApps/_helpers/paper-full.min.js');
   importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps@master/EaselApps/_helpers/paper-easel-api.js');
   importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps@master/EaselApps/_helpers/PaperPathWarp.js');
   importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps@master/EaselApps/_helpers/easel-mod.js');
   
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
    
    
   var properties = function(args) {
      var material = args.material;
      var materialHeight = material.dimensions.z;
      
      var props = [
        {type: 'range', id: "Resolution", value: 100, min: 1, max: 1000, step: 1},
        {type: 'boolean', id: "Fix Path", value: false},
        {type: 'boolean', id: "Reverse", value: false},
        {type: 'boolean', id: "Flip", value: false},
        {type: 'boolean', id: "Invert", value: false}
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
      
      var steps = params["Steps"];
      var resolution = params["Resolution"];
      var fix = params["Fix Path"];
      var reverse = params["Reverse"];
      var flip = params["Flip"];
      var invert = params["Invert"];
      
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      if(selectedVolumes.length != 3) {failure("Please select 3 shapes. The topmost path should be the path to warp"); return false;}
      GeneratePaperPaths(selectedVolumes);
      
      var i;
      var offset;
      var pt;
      
      i = 0;
      while(selectedVolumes[0].PaperPath.className == "CompoundPath") {
        selectedVolumes[0].PaperPath = selectedVolumes[0].PaperPath.firstChild;
        i++;
        if(i>10){failuer("unknown error..."); return false;}
      }
      i = 0;
      while(selectedVolumes[1].PaperPath.className == "CompoundPath") {
        selectedVolumes[1].PaperPath = selectedVolumes[1].PaperPath.firstChild;
        i++;
        if(i>10){failuer("unknown error..."); return false;}
      }
      
      
      var nPath1 = new Path();
      nPath1.add(selectedVolumes[0].PaperPath.getPointAt(0));
      for(i = 1; i <= resolution; i++) {
        offset = selectedVolumes[0].PaperPath.length * i / (resolution);
        pt = selectedVolumes[0].PaperPath.getPointAt(offset);
        nPath1.lineTo(pt);
      }
      selectedVolumes[0].PaperPath = nPath1;
      var nPath2 = new Path();
      nPath2.add(selectedVolumes[1].PaperPath.getPointAt(0));
      for(i = 1; i <= resolution; i++) {
        offset = selectedVolumes[1].PaperPath.length * i / (resolution);
        pt = selectedVolumes[1].PaperPath.getPointAt(offset);
        nPath2.lineTo(pt);
      }
      selectedVolumes[1].PaperPath = nPath2;
      
      
      
      
      var topPath = selectedVolumes[0].PaperPath;
      var bottomPath = selectedVolumes[1].PaperPath;
      var targetPath = selectedVolumes[2].PaperPath;
      if(!flip){
        topPath = selectedVolumes[1].PaperPath; 
        bottomPath = selectedVolumes[0].PaperPath;
        invert = !invert;
      }
      if(reverse) {
        topPath.reverse(); 
        bottomPath.reverse();
        invert = !invert;
      }
      if(fix) {
        topPath.reverse();
        invert = !invert;
      }
      targetPath = targetPath.reorient(true, invert);
      
      const pathWarp = new PathWarp(paper);
      targetPath.warpBetween(topPath, bottomPath);
      //targetPath.children.reverse();
      
      var volumes = [];
      var cutobj = { depth: material.dimensions.z, type: "fill", outlineStyle: "on-path"};
      
      targetPath.children.forEach(function(child){
        if(child.clockwise) {
          child.fillColor = 'rgb(255, 255, 255)';
          volumes.push({PaperPath: child, cut: JSON.parse(JSON.stringify(cutobj))});
        } else {
          child.fillColor = 'rgb(0, 0, 0)';
          cutobj.depth = 0;
          volumes.push({PaperPath: child, cut: JSON.parse(JSON.stringify(cutobj))});
        }
      });
      
      
      PaperToEasel(volumes);
      volumes.forEach(function(volume){
        delete volume.PaperPath;
      });
      success(volumes);
    };
