
    function GeneratePaperPaths(Volumes) {
      
      Volumes.forEach(function(Volume) {
        var path;
        var shape = Volume.shape;
        
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
              path = new Path({segments: pathsegs});
              path.closed = (shape.points[0][0] == shape.points[0][shape.points[0].length - 1]);
              
              cp.addChild(path);
            });
            cp.fullySelected = true;
            path = cp.unite();
            
            break;
          default:
            failure("Shape " + shape.type + " cannot be combined.");
            return false;
        }
        
        var bounds = path.bounds;
        var scalex = shape.width / bounds.width;
        var scaley = shape.height / bounds.height;
		if(shape.width == 0) {scalex = 1;}
		if(shape.height == 0) {scaley = 1;}
        path.scale(scalex, scaley);
        path.position = new Point(shape.center.x, shape.center.y);
        
        if(shape.flipping.horizontal) {
          path.scale(-1, 1);
        }
        if(shape.flipping.vertical) {
          path.scale(1, -1);
        }
        
        path.rotate(shape.rotation * 180 / Math.PI);
        Volume.PaperPath = path;
        //paths.push(path);
      });
    }
    
    function PaperToEasel(Volumes) {
      Volumes.forEach(function(Volume) {
        var PtArrs = [];
        var PtArr = [];
        var SegArr = [];
      
        var nPath = Volume.PaperPath;
		var isClosed = true;
		if(nPath.className == 'Path') {
			// Only works with paths, not compound paths
			if(Volume.shape.points.length == 1) {
				// Only one path, could be an open line
				if(Volume.shape.points[0][0] != Volume.shape.points[0][Volume.shape.points.length-1]) {
					// End points are not equal
					isClosed = false;
				}
			}
		}
        
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
			if(isClosed) {
				PtArr.push(PtArr[0]);
			}
            
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
        
        var newVol = EASEL.pathUtils.fromPointArrays(PtArrs);
        if(newVol != null) {
          if(newVol.shape != null) {
            Volume.shape = newVol.shape;
          }
        }
      });
    }