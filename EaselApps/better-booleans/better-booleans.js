    paper.install(this);
    paper.setup([100, 100]);
			
    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = [
      {type: 'list', id:"Combine Type", value: "Default", options: ["Default","Intersect","Exclude"]},
      {type: 'boolean', id:"Remove Original", value: true}
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

    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      var volumes = args.volumes;
      var selectedVolumes = getSelectedVolumes(volumes, args.selectedVolumeIds);
      var type = params["Combine Type"];
      
      if(selectedVolumes.length < 2) {
        failure('Two or more shapes required');
        return false;
      }
      
      var path;
      var pointarrs;
      var paths = [];
      selectedVolumes.forEach(function(Volume) {
        var shape = Volume.shape;
        var solid = (Volume.cut.depth === 0) ? 0 : 1;
        
        switch (shape.type) {
          case 'rectangle':
            path = new Path.Rectangle(new Point(shape.center.x - shape.width/2, shape.center.y - shape.height/2), new Size(shape.width, shape.height));
            break;
          case 'ellipse':
            path = new Path.Ellipse(new Rectangle(new Point(shape.center.x - shape.width/2, shape.center.y - shape.height/2), new Size(shape.width, shape.height)));
            break;
          case 'polygon':
          case 'path':
          case 'polyline':
            
            var cp = new CompoundPath();
            pointarrs = shape.points;
            if(shape.type == "polygon") {
              pointarrs = [shape.points];
            }
            pointarrs.forEach(function(pointarr) {
              var pathsegs = [];
              pointarr.forEach(function(pt){
                var point = new Point(pt.x, pt.y);
                var handleIn = (pt.lh) ? (new Point(pt.lh.x, pt.lh.y)) : null;
                var handleOut = (pt.rh) ? (new Point(pt.rh.x, pt.rh.y)) : null;
                pathsegs.push(new Segment(point, handleIn, handleOut));
              });
              path = new Path({segments: pathsegs, closed:true});
              
              cp.addChild(path);
            });
            cp.fullySelected = true;
            path = cp.unite();
            
            break;
          default:
            failure("Shape " + shape.type + " cannot be combined.");
            return false;
        }
        
        path.solid = solid;
        var bounds = path.bounds;
        var scalex = shape.width / bounds.width;
        var scaley = shape.height / bounds.height;
        path.scale(scalex, scaley);
        path.position = new Point(shape.center.x, shape.center.y);
        
        if(shape.flipping.horizontal) {
          path.scale(-1, 1);
        }
        if(shape.flipping.vertical) {
          path.scale(1, -1);
        }
        
        path.rotate(shape.rotation * 180 / Math.PI);
        paths.push(path);
      });
      
      var nPath = new Path();
      //var nPath = paths.shift();
      switch(type) {
        case "Intersect":
          nPath = paths.shift();
          paths.forEach(function(child){
            nPath = nPath.intersect(child);
          });
          break;
        case "Exclude":
          nPath = paths.shift();
          paths.forEach(function(child){
            nPath = nPath.exclude(child);
          });
          break;
        default:
          paths.forEach(function(child){
            if(child.solid === 0) {
              nPath = nPath.subtract(child);
            } else {
              nPath = nPath.unite(child);
            }
          });
      }
      
      
      var PtArrs = [];
      var PtArr = [];
      var SegArr = [];
      
      switch(nPath.className) {
        case 'Path':
          PtArr = [];
          SegArr = nPath.segments;
          SegArr.forEach(function(Seg) {
            var point = {
              x: Seg.point.x,
              y: Seg.point.y,
              lh: {x: Seg.handleIn.x, y: Seg.handleIn.y},
              rh: {x: Seg.handleOut.x, y: Seg.handleOut.y}
            };
            PtArr.push(point);
          });
          PtArr.push(PtArr[0]);
          PtArrs.push(PtArr);
          break;
        case 'CompoundPath':
          nPath.children.forEach(function(child){
            PtArr = [];
            SegArr = child.segments;
            SegArr.forEach(function(Seg) {
              var point = {
                x: Seg.point.x,
                y: Seg.point.y,
                lh: {x: Seg.handleIn.x, y: Seg.handleIn.y},
                rh: {x: Seg.handleOut.x, y: Seg.handleOut.y}
              };
              PtArr.push(point);
            });
            PtArr.push(PtArr[0]);
            PtArrs.push(PtArr);
          });
          break;
        default:
        
      }
      
      var NewVolumes = [];
      
      var newVol = EASEL.pathUtils.fromPointArrays(PtArrs);
      NewVolumes.push({
        shape: newVol.shape,
        cut: {
          depth: material.dimensions.z,
          type: 'fill',
          outlineStyle: 'on-path',
          tabPreference: false
        }
      });
      
      if(params["Remove Original"]) {
        selectedVolumes.forEach(function(volume){
          delete volume.shape;
          delete volume.cut;
          NewVolumes.push(volume);
        });
      }
      
      success(NewVolumes);
    };
