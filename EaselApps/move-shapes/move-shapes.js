  // For Development Purposes
  //importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
  //importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
  //importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/helper-functions.js');
  
  var properties = [
    {type: 'list', id:"Start Point", value: "Specific Point", options: ["Origin","Specific Point","Bottom-Left","Bottom-Center","Bottom-Right","Center-Left","Center-Center","Center-Right","Top-Left","Top-Center","Top-Right"]},
    {type: 'list', id:"End Point", value: "Specific Point", options: ["Origin","Specific Point","Bottom-Left","Bottom-Center","Bottom-Right","Center-Left","Center-Center","Center-Right","Top-Left","Top-Center","Top-Right"]},
    {type: 'text', id:"Specific Start Point", value: "0,0"},
    {type: 'text', id:"Specific End Point", value: "0,0"},
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
    
    var StartPt_Type = params["Start Point"];
    var EndPt_Type = params["End Point"];
    var StartPt_Specific = params["Specific Start Point"];
    var EndPt_Specific = params["Specific End Point"];
    
    var StartPt = [];
    var EndPt = [];
    
    ConvertVolumes(selectedVolumes);
    var BB = EASEL.volumeHelper.boundingBox(selectedVolumes);
    
    switch(StartPt_Type) {
      case "Origin":
        StartPt[0] = 0;
        StartPt[1] = 0;
        break;
      case "Specific Point":
        StartPt = StartPt_Specific.split(",");
        if(StartPt.length != 2) {StartPt = []; StartPt[0] = 0; StartPt[1] = 0;}
        StartPt[0] = parseFloat(StartPt[0]); StartPt[0] = isNaN(StartPt[0]) ? 0 : StartPt[0];
        StartPt[1] = parseFloat(StartPt[1]); StartPt[1] = isNaN(StartPt[1]) ? 0 : StartPt[1];
        StartPt[0] *= unitconv;
        StartPt[1] *= unitconv;
        break;
      case "Bottom-Left":
        StartPt[0] = BB.left;
        StartPt[1] = BB.bottom;
        break;
      case "Bottom-Center":
        StartPt[0] = (BB.left + BB.right) / 2;
        StartPt[1] = BB.bottom;
        break;
      case "Bottom-Right":
        StartPt[0] = BB.right;
        StartPt[1] = BB.bottom;
        break;
      case "Center-Left":
        StartPt[0] = BB.left;
        StartPt[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Center-Center":
        StartPt[0] = (BB.left + BB.right) / 2;
        StartPt[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Center-Right":
        StartPt[0] = BB.right;
        StartPt[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Top-Left":
        StartPt[0] = BB.left;
        StartPt[1] = BB.top;
        break;
      case "Top-Center":
        StartPt[0] = (BB.left + BB.right) / 2;
        StartPt[1] = BB.top;
        break;
      case "Top-Right":
        StartPt[0] = BB.right;
        StartPt[1] = BB.top;
        break;
    }
    
    switch(EndPt_Type) {
      case "Origin":
        EndPt[0] = 0;
        EndPt[1] = 0;
        break;
      case "Specific Point":
        EndPt = EndPt_Specific.split(",");
        if(EndPt.length != 2) {EndPt = []; EndPt[0] = 0; EndPt[1] = 0;}
        EndPt[0] = parseFloat(EndPt[0]); EndPt[0] = isNaN(EndPt[0]) ? 0 : EndPt[0];
        EndPt[1] = parseFloat(EndPt[1]); EndPt[1] = isNaN(EndPt[1]) ? 0 : EndPt[1];
        EndPt[0] *= unitconv;
        EndPt[1] *= unitconv;
        break;
      case "Bottom-Left":
        EndPt[0] = BB.left;
        EndPt[1] = BB.bottom;
        break;
      case "Bottom-Center":
        EndPt[0] = (BB.left + BB.right) / 2;
        EndPt[1] = BB.bottom;
        break;
      case "Bottom-Right":
        EndPt[0] = BB.right;
        EndPt[1] = BB.bottom;
        break;
      case "Center-Left":
        EndPt[0] = BB.left;
        EndPt[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Center-Center":
        EndPt[0] = (BB.left + BB.right) / 2;
        EndPt[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Center-Right":
        EndPt[0] = BB.right;
        EndPt[1] = (BB.bottom + BB.top) / 2;
        break;
      case "Top-Left":
        EndPt[0] = BB.left;
        EndPt[1] = BB.top;
        break;
      case "Top-Center":
        EndPt[0] = (BB.left + BB.right) / 2;
        EndPt[1] = BB.top;
        break;
      case "Top-Right":
        EndPt[0] = BB.right;
        EndPt[1] = BB.top;
        break;
    }
    
    var translate_x = EndPt[0] - StartPt[0];
    var translate_y = EndPt[1] - StartPt[1];
    
    selectedVolumes.forEach(function(vol){
      switch(vol.shape.type){
        case "path":
          vol.shape.center.x += translate_x;
          vol.shape.center.y += translate_y;
          break;
        case "text":
          vol.shape.center.x += translate_x;
          vol.shape.center.y += translate_y;
          break;
        case "line":
          vol.shape.point1.x += translate_x;
          vol.shape.point1.y += translate_y;
          
          vol.shape.point2.x += translate_x;
          vol.shape.point2.y += translate_y;
          break;
        case "drill":
          vol.shape.center.x += translate_x;
          vol.shape.center.y += translate_y;
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
