  // For Development Purposes
  //importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
  //importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
  //importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/helper-functions.js');
  
  var properties = [
    {type: 'list', id:"Rotate About", value: "Origin", options: ["Origin","Specific Point","Bottom-Left","Bottom-Center","Bottom-Right","Center-Left","Center-Center","Center-Right","Top-Left","Top-Center","Top-Right"]},
    {type: 'text', id:"Specific Point", value: "0,0"},
    {type: 'range', id:"Degrees", value: 0, min: -180, max: 180, step: 1},
    {type: 'boolean', id: "Show All", value: true}
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
  
  var getUnSelectedVolumes = function(volumes, selectedVolumeIds) {
    var unselectedVolumes = [];
    var volume;
    for (i = 0; i < volumes.length; i++) {
      volume = volumes[i];
      if (selectedVolumeIds.indexOf(volume.id) == -1) {
        unselectedVolumes.push(volume);
      }
    }
    return unselectedVolumes;
  };

  var executor = function(args, success, failure) {
    var params = args.params;
    var material = args.material;
    var volumes = args.volumes;
    var selectedVolumes = getSelectedVolumes(volumes, args.selectedVolumeIds);
    var unselectedVolumes = getUnSelectedVolumes(volumes, args.selectedVolumeIds);
    var unitconv = (args.preferredUnit == "in") ? 1 : 1 / 25.4;
    var RotateType = params["Rotate About"];
    var SpecificPt = params["Specific Point"];
    var Degrees = params["Degrees"];
    
    var PtofRotation = [];
    
    ConvertVolumes(selectedVolumes);
    
    var BB = EASEL.volumeHelper.boundingBox(selectedVolumes);
    
    switch(RotateType) {
      case "Origin":
        PtofRotation[0] = 0;
        PtofRotation[1] = 0;
        break;
      case "Specific Point":
        PtofRotation = SpecificPt.split(",");
        if(PtofRotation.length != 2) {PtofRotation = []; PtofRotation[0] = 0; PtofRotation[1] = 0;}
        PtofRotation[0] = parseFloat(PtofRotation[0]); PtofRotation[0] = isNaN(PtofRotation[0]) ? 0 : PtofRotation[0];
        PtofRotation[1] = parseFloat(PtofRotation[1]); PtofRotation[1] = isNaN(PtofRotation[1]) ? 0 : PtofRotation[1];
        PtofRotation[0] *= unitconv;
        PtofRotation[1] *= unitconv;
        break;
      case "Bottom-Left":
        PtofRotation[0] = BB.left;
        PtofRotation[1] = BB.bottom;
        break;
      case "Bottom-Center":
        PtofRotation[0] = (BB.left + BB.right) / 2;
        PtofRotation[1] = BB.bottom;
        break;
      case "Bottom-Right":
        PtofRotation[0] = BB.right;
        PtofRotation[1] = BB.bottom;
        break;
      case "Center-Left":
        PtofRotation[0] = BB.left;
        PtofRotation[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Center-Center":
        PtofRotation[0] = (BB.left + BB.right) / 2;
        PtofRotation[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Center-Right":
        PtofRotation[0] = BB.right;
        PtofRotation[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Top-Left":
        PtofRotation[0] = BB.left;
        PtofRotation[1] = BB.top;
        break;
      case "Top-Center":
        PtofRotation[0] = (BB.left + BB.right) / 2;
        PtofRotation[1] = BB.top;
        break;
      case "Top-Right":
        PtofRotation[0] = BB.right;
        PtofRotation[1] = BB.top;
        break;
    }
    
    var translate_x = 0;
    var translate_y = 0;
    
    selectedVolumes.forEach(function(vol){
      switch(vol.shape.type){
        case "path":
          vol.shape.rotation += Degrees * Math.PI / 180;
          vol.shape.center = rotatept(PtofRotation[0], PtofRotation[1], vol.shape.center.x, vol.shape.center.y, -1 * Degrees * Math.PI / 180);
          break;
        case "text":
          vol.shape.rotation += Degrees * Math.PI / 180;
          vol.shape.center = rotatept(PtofRotation[0], PtofRotation[1], vol.shape.center.x, vol.shape.center.y, -1 *  Degrees * Math.PI / 180);
          break;
        case "line":
          vol.shape.point1 = rotatept(PtofRotation[0], PtofRotation[1], vol.shape.point1.x, vol.shape.point1.y, -1 *  Degrees * Math.PI / 180);
          vol.shape.point2 = rotatept(PtofRotation[0], PtofRotation[1], vol.shape.point2.x, vol.shape.point2.y, -1 *  Degrees * Math.PI / 180);
          break;
        case "drill":
          vol.shape.center = rotatept(PtofRotation[0], PtofRotation[1], vol.shape.center.x, vol.shape.center.y, -1 *  Degrees * Math.PI / 180);
          break;
        default:
      }
    });
    
    
    var pushvolumes = [];
    pushvolumes.push(...selectedVolumes);
    
     if(params["Show All"]) {
      pushvolumes.push(...unselectedVolumes);
    }
    
    success(pushvolumes);
  };
