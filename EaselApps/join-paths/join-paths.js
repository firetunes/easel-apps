    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = [
      {type: 'boolean', id: "Generate Closed Shape", value: true}
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
    
    function NormalizeVolumePoints(Volume) {
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
      
      var normVolumes = [];
      for (i = 0; i < selectedVolumes.length; i++) {
        var normVolume = NormalizeVolumePoints(selectedVolumes[i]);
        normVolume.cut = JSON.parse(JSON.stringify(selectedVolumes[0].cut));
        normVolumes.push(normVolume);
      }
      
      var BBShapes = EASEL.volumeHelper.boundingBox(normVolumes);
      
      // 1. Get all arrays of points. !!!! NEED TO BE IN PROPER CONTEXT (SCALE, ROTATION, TRANSLATION ACCOUNTED FOR) !!!!
      var AllArr = [];
      for (i = 0; i < normVolumes.length; i++) {
        for(j = 0; j < normVolumes[i].shape.points.length; j++) {
          AllArr.push([...normVolumes[i].shape.points[j]]);
        }
      }
      
      // 2. Order and reverse paths as necessary
      var OrdArr = [];
      OrdArr.push(AllArr.shift());
      
      while(AllArr.length > 0) {
        var cvalue = Infinity;
        var cindex = -1;
        var crev = false;
        var lastseg = JSON.parse(JSON.stringify(OrdArr[OrdArr.length - 1]));
        
        for(var i = 0; i < AllArr.length; i++) {
          var spt_value = distancebetweenpoints(lastseg[lastseg.length - 1], AllArr[i][0]);
          var ept_value = distancebetweenpoints(lastseg[lastseg.length - 1], AllArr[i][AllArr[i].length - 1]);
          
          if(spt_value < cvalue) {cvalue = spt_value; cindex = i; crev = false;}
          if(ept_value < cvalue) {cvalue = ept_value; cindex = i; crev = true;}
          
        }
        
        var NextArr = AllArr.splice(cindex,1)[0];
        
        if(crev) {
          NextArr = NextArr.reverse();
          NextArr.forEach(function(point) {
            if(point.hasOwnProperty('rh')){ point._rh = point.rh; delete point.rh; }
            if(point.hasOwnProperty('lh')){ point._lh = point.lh; delete point.lh; }
            if(point.hasOwnProperty('_rh')){ point.lh = point._rh; delete point._rh; }
            if(point.hasOwnProperty('_lh')){ point.rh = point._lh; delete point._lh; }
          });
        }
        
        OrdArr.push(NextArr);
      }
      
      // 3. Join all individual paths into single path (join all arrays)
      var mergedPoints = [].concat.apply([], OrdArr);
      var mergedVolume = EASEL.pathUtils.fromPointArrays([mergedPoints]);
      mergedVolume.cut = JSON.parse(JSON.stringify(selectedVolumes[0].cut));
      
      if(params["Generate Closed Shape"]) {
        mergedVolume.shape.points[0].push(mergedVolume.shape.points[0][0]);
      }
      
      success([mergedVolume]);
      return true;
      
    };
