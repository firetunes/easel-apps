  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/helper-functions.js');
  var properties = [];
  
  var getSelectedVolumes = function(volumes, selectedVolumeIds){
    return volumes.filter(function(volume){
      return selectedVolumeIds.indexOf(volume.id) >= 0;
    });
  };

  var executor = function(args, success, failure) {
    var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
    ConvertVolumes(selectedVolumes);
    
    selectedVolumes.forEach(function(vol){
      if(vol.shape.type == "text") {
        vol.shape.type = "path";
        vol.shape.points = vol.shape.fontPath.points;
        vol.shape.center = vol.shape.fontPath.center;
        vol.shape.height = vol.shape.fontPath.height;
        vol.shape.width = vol.shape.fontPath.width;
      }
    })
    
    
    var nVols = [];
    GeneratePaperPaths(selectedVolumes);
    
    selectedVolumes.forEach(function(vol){
        if(vol.shape.type == "line" ) {failure("Lines are not supported."); return false;}
        if(vol.shape.type == "drill" ) {failure("Drills are not supported."); return false;}
        if(vol.shape.type == "text" ) {failure("Text elements are not supported."); return false;}
        
        // Get all paths (explode compund paths)
        // each path will be a new volume
        // reorient paths first then get path direction to determine fill color
        if(vol.PaperPath.className == "CompoundPath") {
          
        } else if(vol.PaperPath.className == "Path") {
          
        }
        
    });
    PaperToEasel(intersectvols);
      
    success(selectedVolumes);
  };
  
  