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

function vectorchange(xCoord, yCoord, angle, length) {
    length = typeof length !== 'undefined' ? length : 10;
    angle = angle * Math.PI / 180; // if you're using degrees instead of radians
    return [length * Math.cos(angle) + xCoord, length * Math.sin(angle) + yCoord];
}

function FindMaxOffset(volin, minsize, maxsize, level) {
    if(level > 25) { return ((maxsize + minsize) / 2); }
    var offvol = EASEL.volumeHelper.expand([volin], (-1 * (maxsize + minsize) / 2));
    if(offvol === null) {
      //console.log('Null ' + level);
      maxsize = (maxsize + minsize) / 2;
      return FindMaxOffset(volin, minsize, maxsize, level + 1);
    } else {
      //console.log('Not Null ' + level);
      minsize = (maxsize + minsize) / 2;
      return FindMaxOffset(volin, minsize, maxsize, level + 1);
    }
  }
  
  function ConvertVolumes(volumes) {
    volumes.forEach(function(vol){
      let points = [];
      let nVol = null;
      let scalex = 1;
      let scaley = 1;
      switch(vol.shape.type){
        case "rectangle":
          points.push({x: 0, y: 0});
          points.push({x: 0, y: 1});
          points.push({x: 1, y: 1});
          points.push({x: 1, y: 0});
          points.push({x: 0, y: 0});
          
          scalex = vol.shape.width;
          scaley = vol.shape.height;
          
          points.forEach(function(pt) {
            pt.x *= scalex;
            pt.y *= scaley;
            if(pt.lh) {pt.lh.x *= scalex; pt.lh.y *= scaley;}
            if(pt.rh) {pt.rh.x *= scalex; pt.rh.y *= scaley;}
			pt.x += vol.shape.center.x - vol.shape.width / 2;
			pt.y += vol.shape.center.y - vol.shape.height / 2;
          });
          
          points.forEach(function(pt) {
            let npt = rotatept(0, 0, pt.x, pt.y, vol.shape.rotation * -1);
            pt.x = npt.x;
            pt.y = npt.y;
            if(pt.lh) {let nlpt = rotatept(0, 0, pt.lh.x, pt.lh.y, vol.shape.rotation * -1); pt.lh.x = nlpt.x; pt.lh.y = nlpt.y;}
            if(pt.rh) {let nrpt = rotatept(0, 0, pt.rh.x, pt.rh.y, vol.shape.rotation * -1); pt.rh.x = nrpt.x; pt.rh.y = nrpt.y;}
          });
          
          nVol = EASEL.pathUtils.fromPointArrays([points]);
          nVol.shape.center = JSON.parse(JSON.stringify(vol.shape.center));
          vol.shape = JSON.parse(JSON.stringify(nVol.shape));
          
          break;
        case "ellipse":
          let c = 0.5522847498 / 2;
          points.push({x: 0.5, y: 0.0, rh:{x:-c, y: 0}, lh:{x:  c, y: 0}});
          points.push({x: 0.0, y: 0.5, rh:{x: 0, y: c}, lh:{x:  0, y:-c}});
          points.push({x: 0.5, y: 1.0, rh:{x: c, y: 0}, lh:{x: -c, y: 0}});
          points.push({x: 1.0, y: 0.5, rh:{x: 0, y:-c}, lh:{x:  0, y: c}});
          points.push({x: 0.5, y: 0.0, rh:{x:-c, y: 0}, lh:{x:  c, y: 0}});
          
          scalex = vol.shape.width;
          scaley = vol.shape.height;
          
          points.forEach(function(pt) {
            pt.x *= scalex;
            pt.y *= scaley;
            if(pt.lh) {pt.lh.x *= scalex; pt.lh.y *= scaley;}
            if(pt.rh) {pt.rh.x *= scalex; pt.rh.y *= scaley;}
          });
          
          points.forEach(function(pt) {
            let npt = rotatept(0, 0, pt.x, pt.y, vol.shape.rotation * -1);
            pt.x = npt.x;
            pt.y = npt.y;
            if(pt.lh) {let nlpt = rotatept(0, 0, pt.lh.x, pt.lh.y, vol.shape.rotation * -1); pt.lh.x = nlpt.x; pt.lh.y = nlpt.y;}
            if(pt.rh) {let nrpt = rotatept(0, 0, pt.rh.x, pt.rh.y, vol.shape.rotation * -1); pt.rh.x = nrpt.x; pt.rh.y = nrpt.y;}
          });
          
          nVol = EASEL.pathUtils.fromPointArrays([points]);
          nVol.shape.center = JSON.parse(JSON.stringify(vol.shape.center));
          vol.shape = JSON.parse(JSON.stringify(nVol.shape));
          break;
        case "polygon":
		/*
		  let polypts = [];
		  polypts.push(vol.shape.points[0]);
		  for(let i = 1; i < vol.shape.points.length - 1; i++) {
			  let npolypt = {x: polypts[i - 1].x + vol.shape.points[i].x, y: polypts[i - 1].y + vol.shape.points[i].y};
			  polypts.push(npolypt);
		  }
		  polypts.push(polypts[0]);
		  points = [polypts];
		*/
          points = [JSON.parse(JSON.stringify(vol.shape.points))];
		  points[0].push(vol.shape.points[0]);
          nVol = EASEL.pathUtils.fromPointArrays(points);
          
          scalex = vol.shape.width / nVol.shape.width;
          scaley = vol.shape.height / nVol.shape.height;
          
          if(vol.shape.flipping.horizontal) { scalex *= -1; }
          if(vol.shape.flipping.vertical) { scaley *= -1; }
          
          points.forEach(function(ptArr){
            ptArr.forEach(function(pt) {
              pt.x = pt.x * scalex + (vol.shape.center.x - nVol.shape.center.x * scalex);
              pt.y = pt.y * scaley + (vol.shape.center.y - nVol.shape.center.y * scaley);
              if(pt.lh) {pt.lh.x *= scalex; pt.lh.y *= scaley;}
              if(pt.rh) {pt.rh.x *= scalex; pt.rh.y *= scaley;}
            });
            
             ptArr.forEach(function(pt) {
              let npt = rotatept(vol.shape.center.x, vol.shape.center.y, pt.x, pt.y, vol.shape.rotation * -1);
              pt.x = npt.x;
              pt.y = npt.y;
              if(pt.lh) {let nlpt = rotatept(0, 0, pt.lh.x, pt.lh.y, vol.shape.rotation * -1); pt.lh.x = nlpt.x; pt.lh.y = nlpt.y;}
              if(pt.rh) {let nrpt = rotatept(0, 0, pt.rh.x, pt.rh.y, vol.shape.rotation * -1); pt.rh.x = nrpt.x; pt.rh.y = nrpt.y;}
            });
          });
          
          nVol = EASEL.pathUtils.fromPointArrays(points);
          vol.shape = JSON.parse(JSON.stringify(nVol.shape));
          break;
        case "path":
          points = JSON.parse(JSON.stringify(vol.shape.points));
          nVol = EASEL.pathUtils.fromPointArrays(points);
          
          scalex = vol.shape.width / nVol.shape.width;
          scaley = vol.shape.height / nVol.shape.height;
          if(isNaN(scalex)) {scalex = 1;}
          if(isNaN(scaley)) {scaley = 1;}
          
          if(vol.shape.flipping.horizontal) { scalex *= -1; }
          if(vol.shape.flipping.vertical) { scaley *= -1; }
          
          points.forEach(function(ptArr){
            ptArr.forEach(function(pt) {
              pt.x = pt.x * scalex + (vol.shape.center.x - nVol.shape.center.x * scalex);
              pt.y = pt.y * scaley + (vol.shape.center.y - nVol.shape.center.y * scaley);
              if(pt.lh) {pt.lh.x *= scalex; pt.lh.y *= scaley;}
              if(pt.rh) {pt.rh.x *= scalex; pt.rh.y *= scaley;}
            });
            
             ptArr.forEach(function(pt) {
              let npt = rotatept(vol.shape.center.x, vol.shape.center.y, pt.x, pt.y, vol.shape.rotation * -1);
              pt.x = npt.x;
              pt.y = npt.y;
              if(pt.lh) {let nlpt = rotatept(0, 0, pt.lh.x, pt.lh.y, vol.shape.rotation * -1); pt.lh.x = nlpt.x; pt.lh.y = nlpt.y;}
              if(pt.rh) {let nrpt = rotatept(0, 0, pt.rh.x, pt.rh.y, vol.shape.rotation * -1); pt.rh.x = nrpt.x; pt.rh.y = nrpt.y;}
            });
          });
          
          nVol = EASEL.pathUtils.fromPointArrays(points);
          vol.shape = JSON.parse(JSON.stringify(nVol.shape));
          break;
        case "text":
          nVol = EASEL.pathUtils.fromPointArrays(vol.shape.fontPath.points);
          
          scalex = vol.shape.fontPath.width / nVol.shape.width;
          scaley = vol.shape.fontPath.height / nVol.shape.height;
          
          if(vol.shape.fontPath.flipping.horizontal) { scalex *= -1; }
          if(vol.shape.fontPath.flipping.vertical) { scaley *= -1; }
          
          points = JSON.parse(JSON.stringify(vol.shape.fontPath.points));
          
          points.forEach(function(ptArr){
            ptArr.forEach(function(pt) {
              pt.x = pt.x * scalex + (vol.shape.fontPath.center.x - nVol.shape.center.x * scalex);
              pt.y = pt.y * scaley + (vol.shape.fontPath.center.y - nVol.shape.center.y * scaley);
              if(pt.lh) {pt.lh.x *= scalex; pt.lh.y *= scaley;}
              if(pt.rh) {pt.rh.x *= scalex; pt.rh.y *= scaley;}
            });
            
             ptArr.forEach(function(pt) {
              let npt = rotatept(vol.shape.fontPath.center.x, vol.shape.fontPath.center.y, pt.x, pt.y, vol.shape.fontPath.rotation * -1);
              pt.x = npt.x;
              pt.y = npt.y;
              if(pt.lh) {let nlpt = rotatept(0, 0, pt.lh.x, pt.lh.y, vol.shape.fontPath.rotation * -1); pt.lh.x = nlpt.x; pt.lh.y = nlpt.y;}
              if(pt.rh) {let nrpt = rotatept(0, 0, pt.rh.x, pt.rh.y, vol.shape.fontPath.rotation * -1); pt.rh.x = nrpt.x; pt.rh.y = nrpt.y;}
            });
          });
          
          nVol = EASEL.pathUtils.fromPointArrays(points);
          vol.shape.fontPath = JSON.parse(JSON.stringify(nVol.shape));
          
          
          break;
        case "polyline":
          // Unused - ignore
          break;
        case "line":
          // Don't need to convert
          break;
        case "drill":
          // Don't need to convert
          break;
        default:
      }
      
    });
  }
  
  function rotatept(cx, cy, x, y, angle) {
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
    var ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return {x: nx, y: ny};
  }
  