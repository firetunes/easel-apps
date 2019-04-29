    var normVolumes = [];
    
    var properties = function(args) {
      var params = args.params;
      var volumes = args.volumes;
      var selectedVolumes = getSelectedVolumes(volumes, args.selectedVolumeIds);
      var i;
      
      // Normalize volume
      for (i = 0; i < selectedVolumes.length; i++) {
        var normVolume = NormalizeVolumePoints(selectedVolumes[i]);
        normVolume.cut = JSON.parse(JSON.stringify(selectedVolumes[0].cut));
        normVolumes.push(normVolume);
      }
      
      
      var props = [
        {type: 'range', id: "Specify Start Point", value: 0, min:0, max: (normVolumes[0].shape.points[0].length - 1)},
        {type: 'range', id: "Specify Length", value: (normVolumes[0].shape.points[0].length), min:1, max: (normVolumes[0].shape.points[0].length)},
        {type: 'boolean', id: "Reverse Path", value: false}
      ];
      
      return props;
    };
    
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
    
    function NormalizeVolumePoints(Volume) {
      if(Volume.shape.type == "ellipse") {
        var c = 0.5522847498;
        var circlepoints = [
          {x:2, y:3, lh: {x: -c, y: 0}, rh: {x: c, y:0}},
          {x:3, y:2, lh: {x: 0, y: c}, rh: {x: 0, y:-c}},
          {x:2, y:1, lh: {x: c, y: 0}, rh: {x: -c, y:0}},
          {x:1, y:2, lh: {x: 0, y: -c}, rh: {x: 0, y:c}},
          {x:2, y:3, lh: {x: -c, y: 0}, rh: {x: c, y:0}},
        ];
        Volume.shape.points = [circlepoints];
      }
      
      var NormVolume = EASEL.pathUtils.fromPointArrays(Volume.shape.points);
      
      var scaleX = Volume.shape.width / NormVolume.shape.width;
      var scaleY = Volume.shape.height / NormVolume.shape.height;
      
      // have to expand volume to get bounding box in "world space"
      var tmpVol = EASEL.volumeHelper.expand([Volume], 0);
      var BBOriginal = EASEL.volumeHelper.boundingBox([tmpVol]);
      var offsetX = (BBOriginal.right + BBOriginal.left) / 2;
      var offsetY = (BBOriginal.top + BBOriginal.bottom) / 2;
      
      
      // Rotate Points
      var OriginalRotation = Volume.shape.rotation;
      for(var i = 0; i < NormVolume.shape.points.length; i++) {
        for(var j = 0; j < NormVolume.shape.points[i].length; j++) {
          var pt = JSON.parse(JSON.stringify(NormVolume.shape.points[i][j]));
          pt.x *= scaleX;
          pt.y *= scaleY;
          var npt = JSON.parse(JSON.stringify(NormVolume.shape.points[i][j]));
          
          npt.x = (pt.x * Math.cos(OriginalRotation) - pt.y * Math.sin(OriginalRotation)); // - offsetX;
          npt.y = (pt.x * Math.sin(OriginalRotation) + pt.y * Math.cos(OriginalRotation)); // - offsetY;
          if(pt.hasOwnProperty("rh")){
            pt.rh.x *= scaleX;
            pt.rh.y *= scaleY;
            npt.rh.x = (pt.rh.x * Math.cos(OriginalRotation) - pt.rh.y * Math.sin(OriginalRotation));
            npt.rh.y = (pt.rh.x * Math.sin(OriginalRotation) + pt.rh.y * Math.cos(OriginalRotation));
          }
          if(pt.hasOwnProperty("lh")){
            pt.lh.x *= scaleX;
            pt.lh.y *= scaleY;
            npt.lh.x = (pt.lh.x * Math.cos(OriginalRotation) - pt.lh.y * Math.sin(OriginalRotation));
            npt.lh.y = (pt.lh.x * Math.sin(OriginalRotation) + pt.lh.y * Math.cos(OriginalRotation));
          }
          
          NormVolume.shape.points[i][j] = JSON.parse(JSON.stringify(npt));
        }  
      }
      NormVolume = EASEL.pathUtils.fromPointArrays(NormVolume.shape.points);
      var BBNorm = EASEL.volumeHelper.boundingBox([NormVolume]);
      
      var translateX = offsetX - NormVolume.shape.center.x;
      var translateY = offsetY - NormVolume.shape.center.y;
      
      NormVolume.shape.center.x += translateX;
      NormVolume.shape.center.y += translateY;
      
      for(var i = 0; i < NormVolume.shape.points.length; i++) {
        for(var j = 0; j < NormVolume.shape.points[i].length; j++) {
          var npt = JSON.parse(JSON.stringify(NormVolume.shape.points[i][j]));
          
          npt.x += translateX;
          npt.y += translateY;
          NormVolume.shape.points[i][j] = JSON.parse(JSON.stringify(npt));
        }
      }
      
      
      return JSON.parse(JSON.stringify(NormVolume));
    }
    
    function distancebetweenpoints(p1, p2) {
      var dis = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      return dis;
    }

    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args.params;
      var volumes = args.volumes;
      var selectedVolumes = getSelectedVolumes(volumes, args.selectedVolumeIds);
      var i;
      
      if(selectedVolumes.length > 1) {failure("Please select only one shape"); return false;}
      
      if(normVolumes[0].shape.points[0][0] == normVolumes[0].shape.points[0][normVolumes[0].shape.points[0].length - 1]) {
        normVolumes[0].shape.points[0].pop();
      }
      var ptArr = [];
      ptArr.push(...normVolumes[0].shape.points[0]);
      if(ptArr[0].x == ptArr[ptArr.length - 1].x && ptArr[0].y == ptArr[ptArr.length - 1].y) { ptArr.pop(); }
      ptArr.push(...normVolumes[0].shape.points[0]);
      
      if(params["Reverse Path"]) {
        ptArr = JSON.parse(JSON.stringify(ptArr)).reverse();
        ptArr = ptArr.map(function(pt) {
          if(pt.hasOwnProperty('rh')){ pt._rh = pt.rh; delete pt.rh; }
          if(pt.hasOwnProperty('lh')){ pt._lh = pt.lh; delete pt.lh; }
          if(pt.hasOwnProperty('_rh')){ pt.lh = pt._rh; delete pt._rh; }
          if(pt.hasOwnProperty('_lh')){ pt.rh = pt._lh; delete pt._lh; }
          
          return pt;
        });
      }
      ptArr = ptArr.slice(params["Specify Start Point"], params["Specify Start Point"] + params["Specify Length"])
      
      var mergedPoints = [].concat.apply([], ptArr);
      var mergedVolume = EASEL.pathUtils.fromPointArrays([mergedPoints]);
      mergedVolume.cut = JSON.parse(JSON.stringify(selectedVolumes[0].cut));
      
      success([mergedVolume]);
      return true;
      
    };
