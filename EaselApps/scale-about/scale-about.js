  // For Development Purposes
  //importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
  //importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
  //importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/helper-functions.js');
  
  var properties = [
    {type: 'list', id:"Scale About", value: "Origin", options: ["Origin","Specific Point","Bottom-Left","Bottom-Center","Bottom-Right","Center-Left","Center-Center","Center-Right","Top-Left","Top-Center","Top-Right"]},
    {type: 'text', id:"Specific Point", value: "0,0"},
    {type: 'list', id:"Scale By", value: "Factor", options: ["Factor", "New Height", "New Width"]},
    {type: 'range', id:"Scale Value", value: 1, min: 0.1, max: 10},
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
    var ScaleType = params["Scale About"];
    var SpecificPt = params["Specific Point"];
    var ScaleBy = params["Scale By"];
    var ScaleValue = params["Scale Value"];
    var ScalePt = [];
    var ScaleFactor = ScaleValue;
    
    ConvertVolumes(selectedVolumes);
    
    var BB = EASEL.volumeHelper.boundingBox(selectedVolumes);
    
    switch(ScaleBy) {
      case "New Height":
        ScaleFactor = (ScaleValue * unitconv) / BB.height;
        break;
      case "New Width":
        ScaleFactor = (ScaleValue * unitconv) / BB.width;
        break;
    }
    
    switch(ScaleType) {
      case "Origin":
        ScalePt[0] = 0;
        ScalePt[1] = 0;
        break;
      case "Specific Point":
        ScalePt = SpecificPt.split(",");
        if(ScalePt.length != 2) {ScalePt = []; ScalePt[0] = 0; ScalePt[1] = 0;}
        ScalePt[0] = parseFloat(ScalePt[0]); ScalePt[0] = isNaN(ScalePt[0]) ? 0 : ScalePt[0];
        ScalePt[1] = parseFloat(ScalePt[1]); ScalePt[1] = isNaN(ScalePt[1]) ? 0 : ScalePt[1];
        ScalePt[0] *= unitconv;
        ScalePt[1] *= unitconv;
        break;
      case "Bottom-Left":
        ScalePt[0] = BB.left;
        ScalePt[1] = BB.bottom;
        break;
      case "Bottom-Center":
        ScalePt[0] = (BB.left + BB.right) / 2;
        ScalePt[1] = BB.bottom;
        break;
      case "Bottom-Right":
        ScalePt[0] = BB.right;
        ScalePt[1] = BB.bottom;
        break;
      case "Center-Left":
        ScalePt[0] = BB.left;
        ScalePt[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Center-Center":
        ScalePt[0] = (BB.left + BB.right) / 2;
        ScalePt[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Center-Right":
        ScalePt[0] = BB.right;
        ScalePt[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Top-Left":
        ScalePt[0] = BB.left;
        ScalePt[1] = BB.top;
        break;
      case "Top-Center":
        ScalePt[0] = (BB.left + BB.right) / 2;
        ScalePt[1] = BB.top;
        break;
      case "Top-Right":
        ScalePt[0] = BB.right;
        ScalePt[1] = BB.top;
        break;
    }
    
    var translate_x = 0;
    var translate_y = 0;
    
    selectedVolumes.forEach(function(vol){
      switch(vol.shape.type){
        case "path":
          vol.shape.center.x += (vol.shape.center.x - ScalePt[0]) * (ScaleFactor - 1);
          vol.shape.center.y += (vol.shape.center.y - ScalePt[1]) * (ScaleFactor - 1);
          vol.shape.height *= ScaleFactor;
          vol.shape.width *= ScaleFactor;
          break;
        case "text":
          vol.shape.center.x += (vol.shape.center.x - ScalePt[0]) * (ScaleFactor - 1);
          vol.shape.center.y += (vol.shape.center.y - ScalePt[1]) * (ScaleFactor - 1);
          vol.shape.height *= ScaleFactor;
          vol.shape.width *= ScaleFactor;
          break;
        case "line":
          vol.shape.point1.x += (vol.shape.point1.x - ScalePt[0]) * (ScaleFactor - 1);
          vol.shape.point1.y += (vol.shape.point1.y - ScalePt[1]) * (ScaleFactor - 1);
          vol.shape.point2.x += (vol.shape.point2.x - ScalePt[0]) * (ScaleFactor - 1);
          vol.shape.point2.y += (vol.shape.point2.y - ScalePt[1]) * (ScaleFactor - 1);
          break;
        case "drill":
          vol.shape.center.x += (vol.shape.center.x - ScalePt[0]) * (ScaleFactor - 1);
          vol.shape.center.y += (vol.shape.center.y - ScalePt[1]) * (ScaleFactor - 1);
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
