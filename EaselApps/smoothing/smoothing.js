    
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/helper-functions.js');
    
    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = [
      {type: 'range', id:"Smoothing Factor", value: 1, min: 0.1, max: 2, step: 0.05},
    ];

    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      var volumes = [];
      var factor = params["Smoothing Factor"];
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      ConvertVolumes(selectedVolumes);
      
      
      selectedVolumes.forEach(function(vol){
        if(vol.shape.type == "path" || vol.shape.type == "polygon" ) {
          let clonevol = JSON.parse(JSON.stringify(vol));
          clonevol.id = null;
          
          console.log(JSON.parse(JSON.stringify(clonevol)));
          if(clonevol.shape.type == "polygon") {
            clonevol.shape.type = "path";
            clonevol.shape.points = [clonevol.shape.points];
            clonevol.shape.points.push(clonevol.shape.points.length - 1);
            console.log(JSON.parse(JSON.stringify(clonevol)));
          }
          
          let ptarrs = [];
          clonevol.shape.points.forEach(function(ptarr){
            if(ptarr.length > 2) {
              let newptarr = [];
              if(ptarr[0].x == ptarr[ptarr.length - 1].x && ptarr[0].y == ptarr[ptarr.length - 1].y) {
                console.log("Closed Shape, ");
                // closed loop
                for(let i = 0; i < ptarr.length - 1; i++) {
                  let tmppt;
                  tmppt = getMidPoint(ptarr[i], ptarr[i+1]);
                  tmppt.rh = getOffset(ptarr[i], tmppt);
                  tmppt.lh = getOffset(ptarr[i+1], tmppt);
                  tmppt.rh.x *= factor; tmppt.rh.y *= factor;
                  tmppt.lh.x *= factor; tmppt.lh.y *= factor;
                  newptarr.push(tmppt);
                }
                newptarr.push(newptarr[0]);
              } else {
                console.log("Open Shape, ");
                // open path
                newptarr = JSON.parse(JSON.stringify(ptarr));
              }
              ptarrs.push(newptarr);
            }
          });
          let nVol = EASEL.pathUtils.fromPointArrays(ptarrs);
          clonevol.shape = JSON.parse(JSON.stringify(nVol.shape));
          volumes.push(clonevol);
        }
      });
      
      //volumes.push(...selectedVolumes);
      selectedVolumes.forEach(function(vol){
        delete vol.shape;
        delete vol.cut;
      });
      
      success(volumes);
    };
    
    
    function getMidPoint(pt1, pt2) {
      let pt = {x: 0, y: 0};
      pt.x = (pt2.x + pt1.x) / 2;
      pt.y = (pt2.y + pt1.y) / 2;
      return pt;
    }
    
    function getOffset(pt1, pt2) {
      let pt = {x: 0, y: 0};
      pt.x = pt2.x - pt1.x;
      pt.y = pt2.y - pt1.y;
      return pt;
    }