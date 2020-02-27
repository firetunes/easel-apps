    
    // For Development only
    /*
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/paper-full.min.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/paper-easel-api.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/PNG.js');
    */
    
    paper.install(this);
    paper.setup([100, 100]);
    
    const policy = "eyJleHBpcnkiOjMxMjM5NzM2MTR9";
    const signature = "42a18f73ae40fba07ab06d600933bad5f01672cf72594d0cfb8988e518dbcf3f";
    
    var timeout = null;
    var LoadingImage = false;
    var prevFile = null;
    var fauxPNG = null;
    
    function toDataUrl(url, callback) {
        var urlhalfs = url.split("?");
        var urlparts = urlhalfs[0].split("/");
        var imageid = urlparts.pop();
        
        var options = "output=f:png/resize=height:512,width:512,fit:max/monochrome/";
        var security = "security=policy:" + policy + ",signature:" + signature + "/";
        var newurl = "https://cdn.filestackcontent.com/" + options + security + imageid;
        console.log(newurl);
        
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
              callback(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', newurl);
        xhr.responseType = 'blob';
        xhr.send();
    }
    
    function rotate(cx, cy, x, y, angle) {
      var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
      return [nx, ny];
    }
    
    function calcAngleDegrees(x, y) {
      var ang = Math.atan2(y, x) - Math.PI / 2;
      ang += ang < 0 ? 2 * Math.PI : 0;
      return ang * 180 / Math.PI;
    }
    
    function isOdd(num) { 
      return num % 2;
    }
    
    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = function(args) {
      var props = [
        {type: 'file-input', id: "File"},
        
        // Limits
        {type: 'range', id: "Max Height", value: 12, min: 0, max: 40, step: 1},
        {type: 'range', id: "Max Width", value: 12, min: 0, max: 40, step: 1},
        {type: 'range', id: "Max Hole Qty", value: 10000, min: 100, max: 10000, step: 100},
        
        // Color Correction
        {type: 'range', id: "Clamp (min)", value: 0.05, min: 0, max: 1, step: 0.05},
        {type: 'range', id: "Clamp (max)", value: 0.95, min: 0, max: 1, step: 0.05},
        {type: 'range', id: "Gamma", value: 1, min: 0.01, max: 2, step: 0.05},
        
        // Grid Settings
        {type: 'list', id: "Grid Type", value: "Square", options: ["Square", "Hexagonal", "Spiral"]},
        {type: 'range', id: "Space", value: 15, min: 5, max: 100, step: 1},
        {type: 'range', id: "Angle", value: 0, min: -60, max: 60, step: 5},
        
        // Sampling Settings
        //{type: 'list', id: "Channel", value: "Black", options: ["None", "Luminance", "Red", "Green", "Blue", "Cyan", "Magenta", "Yellow", "Black"]},
        {type: 'boolean', id: "Invert", value: false},
        {type: 'range', id: "Clip (min)", value: 0, min: 0, max: 1, step: 0.05},
        {type: 'range', id: "Clip (max)", value: 1, min: 0, max: 1, step: 0.05},
        {type: 'range', id: "Strength", value: 1, min: 0, max: 1, step: 0.05},
        
        // Shape Settings
        {type: 'list', id: "Shape Style", value: "Circle", options: ["Circle", "Square", "Hexagon"]},
        {type: 'range', id: "Scale", value: 1, min: 0.75, max: 1.5, step: 0.1},
        {type: 'range', id: "Rotation", value: 0, min: -90, max: 90, step: 5},
        {type: 'boolean', id: "Outline", value: false},
        
        // Mode
        {type: 'list', id: "Mode", value: "Dots", options: ["Dots", "Lines"]},
      ];
      
      return props;
    };
    
    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    
    
    var executor = function(args, success, failure) {
      var params = args.params;
      var file = params["File"];
      
      if(file) {
        if(file == prevFile) {
          // Don't reload the image
          console.log("Load Prev");
          setTimeout(function(){ 
            executer_processimage(args, success, failure, JSON.parse(JSON.stringify(fauxPNG))); 
          }, 50);
        } else {
          if(!LoadingImage) {
            LoadingImage = true; // Needed
            toDataUrl(file, function(myBase64) {
              prevFile = file;
              LoadingImage = false;
              executor_parseimage(args, success, failure, myBase64);
            });
          }
          return failure("Loading Image");
        }
      } else {
        failure("Please upload an image");
      }
    };
    
    var executor_parseimage = function(args, success, failure, imgBase64) {
      imgBase64 = imgBase64.slice(22);
      var pngBytes = atob(imgBase64);
      var reader = new PNGReader(pngBytes);
      reader.parse(function(err, png) {
        if(err) {
          failure("There was an error loading the image." + err); 
          return false;
        }
        
        
        var rgba = [];
        var idx = 0;
        switch(png.colorType) {
          case 0: png.pixels.forEach(function(pixel){ rgba.push(pixel,pixel,pixel,255);}); break;
          case 2: idx = 0; png.pixels.forEach(function(pixel){ rgba.push(pixel); idx++; if(idx === 3){ rgba.push(255); idx = 0; }}); break;
          case 3: png.pixels.forEach(function(pixel){ rgba.push(png.palette[pixel], png.palette[pixel+1], png.palette[pixel+2], 255); }); break;
          case 4: idx = 0; png.pixels.forEach(function(pixel){ if(idx == 1) { rgba.push(pixel); idx = 0; } else { rgba.push(pixel,pixel,pixel); idx++; }}); break;
          case 6: rgba = png.pixels; break;
        }
        fauxPNG = {width: png.width, height: png.height, pixels: Array.prototype.slice.call(rgba), colorType: 6};
        
        console.log(png);
        console.log(fauxPNG);
        
        for (var y = 0; y < fauxPNG.height; y++) {
      		for(var x = 0; x < fauxPNG.width; x++) {
            let position = (x + y * fauxPNG.width) * 4;
            let pixel = fauxPNG.pixels.slice(position, position + 4);
            
            // RGBA to RGB
            let background = 255; // 0 to 255
            pixel[0] = (255 - pixel[3]) / 255 * background + pixel[0] * (pixel[3] / 255);
            pixel[1] = (255 - pixel[3]) / 255 * background + pixel[1] * (pixel[3] / 255);
            pixel[2] = (255 - pixel[3]) / 255 * background + pixel[2] * (pixel[3] / 255);
            
            Array.prototype.splice.apply(fauxPNG.pixels, [position, pixel.length].concat(pixel));
      		}
        }
        
        executer_processimage(args, success, failure, JSON.parse(JSON.stringify(fauxPNG)));
      });
      
      return failure("Loading Image"); 
    };
    
    var executer_processimage = function(args, success, failure, png) {
      var params = args.params;
      
      var Proj_MaxHeight = params["Max Height"];    // Used
      var Proj_MaxWidth = params["Max Width"];      // Used
      var Proj_MaxHoleQty = params["Max Hole Qty"]; // Used
      
      var Img_Gamma = params["Gamma"];              // Used
      var Img_ClampMin = params["Clamp (min)"];     // Used
      var Img_ClampMax = params["Clamp (max)"];     // Used
      
      var Grid_Type = params["Grid Type"];          // Used
      var Grid_Space = params["Space"];             // Used
      var Grid_Angle = params["Angle"];             // Used
      
      //var Sampl_Channel = params["Channel"];
      var Sampl_Invert = params["Invert"];
      var Sampl_ClipMin = params["Clip (min)"];     // Used
      var Sampl_ClipMax = params["Clip (max)"];     // Used
      var Sampl_Strength = params["Strength"];      // Used
      
      var Shape_Style = params["Shape Style"];      // Used
      var Shape_Scale = params["Scale"];            // Used
      var Shape_Rotation = params["Rotation"];      // Used
      var Shape_Outline = params["Outline"];        // Used
      
      var Mode = params["Mode"];                    // Used
      
      var volumes = [];
      var cutobj = {type: (Shape_Outline ? "outline" : "fill"), depth: 0.5, outlineStyle: "on-path"};
      var shape_ellipse = {type: "ellipse", width: 1, height: 1, center: {x: 0, y: 0}, rotation: Grid_Angle + Shape_Rotation, isProportionLocked: false, flipping: {}};
      var shape_square = {type: "polygon", width: 1, height: 1, points: [{x: 0, y:0},{x: 0, y:1},{x: 1, y:1},{x: 1, y:0}], center: {x: 0, y: 0}, rotation: Grid_Angle + Shape_Rotation, isProportionLocked: false, flipping: {}};
      var shape_hexagon = {type: "polygon", width: (1 * 2 / Math.sqrt(3)), height: 1, points: [{x: 1, y:0},{x: 1/2, y:-Math.sqrt(3) * 1 / 2},{x: -1/2, y:-Math.sqrt(3) * 1 / 2},{x: -1, y:0},{x: -1/2, y:Math.sqrt(3) * 1 / 2},{x: 1/2, y:Math.sqrt(3) * 1 / 2}], center: {x: 0, y: 0}, rotation: Grid_Angle + Shape_Rotation, isProportionLocked: false, flipping: {}};
      var shapeobj;
      
      var background = {shape: JSON.parse(JSON.stringify(shape_square)), cut: JSON.parse(JSON.stringify(cutobj))};
      background.shape.width = png.width;
      background.shape.height = png.height;
      background.shape.center.x = png.width / 2;
      background.shape.center.y = png.height / 2;
      background.shape.rotation = 0;
      background.cut.depth = 0;
      volumes.push(background);
      
      switch(Shape_Style) {
        case "Circle": shapeobj = shape_ellipse; break;
        case "Square": shapeobj = shape_square; break;
        case "Hexagon": shapeobj = shape_hexagon; break;
      }
      
      // Perform Color Correction
      for (var y = 0; y < png.height; y++) {
    		for(var x = 0; x < png.width; x++) {
          let position = (x + y * png.width) * 4;
          let pixel = png.pixels.slice(position, position + 4);
          
          // Adjust for Clamping
          let luma = Math.max(Math.min(((pixel[0]+pixel[0]+pixel[0]+pixel[1]+pixel[1]+pixel[1]+pixel[1]+pixel[2])>>3) / 255, 1), 0);
          let luma_i = 1 - luma;
          let new_luma = 0;
          let new_luma_i = 0;
          if(luma_i <= Img_ClampMin) {
            new_luma_i = 0;
            pixel[0] = pixel[1] = pixel[2] = 255;
          } else if( luma_i >= Img_ClampMax) {
            new_luma_i = 1;
            pixel[0] = pixel[1] = pixel[2] = 0;
          } else {
            new_luma_i = (1 / (Img_ClampMax - Img_ClampMin)) * (luma_i - Img_ClampMin);
            new_luma = Math.max(Math.min(1 - new_luma_i, 1), 0);
            let luma_scale = new_luma / luma;
            pixel[0] = Math.max(Math.min(pixel[0] * luma_scale, 255), 0);
            pixel[1] = Math.max(Math.min(pixel[1] * luma_scale, 255), 0);
            pixel[2] = Math.max(Math.min(pixel[2] * luma_scale, 255), 0);
         }
          
          // Adjust for Gamma
          pixel[0] = Math.pow(255 * (pixel[0] / 255), Img_Gamma);
          pixel[1] = Math.pow(255 * (pixel[1] / 255), Img_Gamma);
          pixel[2] = Math.pow(255 * (pixel[2] / 255), Img_Gamma);
          
          if(Sampl_Invert) {
            pixel[0] = 255 - pixel[0];
            pixel[1] = 255 - pixel[1];
            pixel[2] = 255 - pixel[2];
          }
          
          Array.prototype.splice.apply(png.pixels, [position, pixel.length].concat(pixel));
    		}
      }
      
      // Create Element Array
      let elements = [];
      if(Grid_Type != "Spiral") {
        // Create Square and Hexagonal Element Array
        let hypot = Math.sqrt(Math.pow(png.width,2) + Math.pow(png.height,2));
        let x_spacing = (Grid_Type == "Square") ? Grid_Space : Grid_Space * 3 / (Math.sqrt(3) * 2) * 2;
        let y_spacing = (Grid_Type == "Square") ? Grid_Space : Grid_Space / 2;
        
        // if(Mode == "Lines") {x_spacing /= 4; } // Increase number of dots in a row
        
        let x_elements = Math.floor(hypot / x_spacing) - ((Math.floor(hypot / x_spacing) % 2 == 1) ? 0 : 1);
        let y_elements = Math.floor(hypot / y_spacing) - ((Math.floor(hypot / y_spacing) % 2 == 1) ? 0 : 1);
        
        let x_offset = (png.width - x_elements * x_spacing) / 2;
        let y_offset = (png.height - y_elements * y_spacing) / 2;
        let hexoffset = (Grid_Type == "Square") ? 0 : x_spacing / 2;
        
        for(let i = 0; i < x_elements; i++) {
          for(let j = 0; j < y_elements; j++) {
            let point = rotate(png.width / 2, png.height / 2, i * x_spacing + x_offset + (isOdd(j) ? hexoffset : 0 ), j * y_spacing + y_offset, Grid_Angle);
            if((point[0]-Grid_Space/2) >= 0 && (point[0]+Grid_Space/2) <= png.width && (point[1]-Grid_Space/2) >= 0 && (point[1]+Grid_Space/2) <= png.height){
              let nearestpixel = (Math.round(point[0]) + Math.round(point[1]) * png.width) * 4;
              let pixel = png.pixels.slice(nearestpixel, nearestpixel + 4);
              let lum = Math.max(Math.min(((pixel[0]+pixel[0]+pixel[0]+pixel[1]+pixel[1]+pixel[1]+pixel[1]+pixel[2])>>3) / 255, 1), 0);
              
              elements.push({x: point[0], y: point[1], l: lum, row: j, col: i, ang: 0});
            }
          }
        }
      } else {
        // Create Spiral Element Array
        let grow = true;
        let r = 0;
        let a = 0;
        let stepsize = Math.PI / 180; // 1 degree
        let group = 0;
        
        let distFactor = Mode == "Lines" ? 4 : 1
        
        let max_r = Math.sqrt(Math.pow(png.width,2) + Math.pow(png.height,2)) / 2;
        
        let prev_x = -Grid_Space;
        let prev_y = -Grid_Space;
        
        while (grow) {
          r = Grid_Space * a / (2 * Math.PI);
          let x = r * Math.cos(a);
          let y = r * Math.sin(a);
      
          let dist = Math.sqrt(Math.pow(x - prev_x, 2) + Math.pow(y - prev_y, 2));
          if(dist >= Grid_Space / distFactor) {
            prev_x = x;
            prev_y = y;
            let point = rotate(0, 0, x, y, Grid_Angle);
            point[0] += png.width / 2;
            point[1] += png.height / 2;
            if((point[0]-Grid_Space/2) >= 0 && (point[0]+Grid_Space/2) <= png.width && (point[1]-Grid_Space/2) >= 0 && (point[1]+Grid_Space/2) <= png.height){
              let nearestpixel = (Math.round(point[0]) + Math.round(point[1]) * png.width) * 4;
              let pixel = png.pixels.slice(nearestpixel, nearestpixel + 4);
              let lum = Math.max(Math.min(((pixel[0]+pixel[0]+pixel[0]+pixel[1]+pixel[1]+pixel[1]+pixel[1]+pixel[2])>>3) / 255, 1), 0);
              
              let ang = 0;
              let ang1 = 0;
              if(elements.length > 0 && elements[elements.length - 1].row == group) {
                ang = calcAngleDegrees(point[1] - elements[elements.length - 1].y, point[0] - elements[elements.length - 1].x);
                elements[elements.length - 1].ang = ang;
              }
              if(elements.length > 1 && elements[elements.length - 2].row == group) {
                ang1 = calcAngleDegrees(elements[elements.length - 1].y - elements[elements.length - 2].y, elements[elements.length - 1].x - elements[elements.length - 2].x);
                ang1 += ang > ang1 ? 360 : 0;
                elements[elements.length - 1].ang = (ang + ang1) / 2;
              } 
              elements.push({x: point[0], y: point[1], l: lum, row: group, col: 0, ang: ang});
            } else {
              group++;
            }
          }
          let isFullRotation = Number.isInteger(a / (2 * Math.PI)) || Number.isInteger((a - Math.PI / 360) / (2 * Math.PI));
          
          a += stepsize - Math.random() * Math.PI / 180;
          if(r > max_r) {grow = false;}
        }
      }
      
      var Paths = [];
      var curPathPts = [];
      var curRow = -1;
      var endpt = null;
      
      elements = elements.sort(function(a, b){
        if(a.row > b.row) return 1;
        if(a.row < b.row) return -1;
        if(a.col > b.col) return 1;
        if(a.col < b.col) return -1;
      });
      
      //elements.forEach(function(ele){
      for (var i = 0, len = elements.length; i < len; i++) {
        ele = elements[i];
        if(Mode == "Lines" && ele.l >= 0.95) { ele.l = 0.95; }
        if(ele.l <= (1 - Sampl_ClipMin) && ele.l >= (1 - Sampl_ClipMax)) {
          let scaler = Grid_Space * (1 - ele.l * Sampl_Strength) * Shape_Scale;
      		let vol = {shape: JSON.parse(JSON.stringify(shapeobj)), cut: JSON.parse(JSON.stringify(cutobj))};
      		vol.shape.center.x = ele.x;
      		vol.shape.center.y = ele.y * -1 + png.height;
      		vol.shape.height *= scaler;
        	vol.shape.width *= scaler;
        	
        	if(ele.row != curRow || scaler <= 0) {
        	  if(curPathPts.length > 0) {
        	    curPathPts.unshift({x: endpt[0], y: endpt[1]});
        	    //curPathPts.push({x: endpt[0], y: endpt[1]});
        	    Paths.push(JSON.parse(JSON.stringify(curPathPts)));
        	  }
        	  curPathPts = [];
        	  curRow = ele.row;
        	}
        	if(scaler > 0) {
          	let y_up = vol.shape.center.y + vol.shape.height / 2;
          	let y_lo = vol.shape.center.y - vol.shape.height / 2;
          	let p0 = rotate(vol.shape.center.x, vol.shape.center.y, vol.shape.center.x, y_up,-1*ele.ang + -1*Grid_Angle - 90);
          	let p1 = rotate(vol.shape.center.x, vol.shape.center.y, vol.shape.center.x, y_up,-1*ele.ang + -1*Grid_Angle);
          	let p2 = rotate(vol.shape.center.x, vol.shape.center.y, vol.shape.center.x, y_lo,-1*ele.ang + -1*Grid_Angle);
          	endpt = rotate(vol.shape.center.x, vol.shape.center.y, vol.shape.center.x, y_up,-1*ele.ang + -1*Grid_Angle + 90)
          	if(curPathPts.length == 0) {curPathPts.push({x: p0[0], y:p0[1]});}
          	curPathPts.unshift({x: p1[0], y:p1[1]});
          	curPathPts.push({x: p2[0], y:p2[1]});
          }
        	
        	
        	if(scaler > 0) {
        	  volumes.push(vol);
        	}
        	if(volumes.length > Proj_MaxHoleQty) {
            failure("Maximum number of holes exceeded. Please adjust parameters.");
            return false;
          }
        }
      }
      if(curPathPts.length > 0) {
        curPathPts.unshift({x: endpt[0], y: endpt[1]});
        Paths.push(JSON.parse(JSON.stringify(curPathPts)));
      }
      
      // Create bars
      if(Mode == "Lines") {
        volumes = [];
        Paths.forEach(function(path){
          let vol = EASEL.pathUtils.fromPointArrays([path]);
          vol.cut = JSON.parse(JSON.stringify(cutobj));
          volumes.push(vol);
        });
        //var nVol = EASEL.pathUtils.fromPointArrays(Paths);
        //nVol.cut = JSON.parse(JSON.stringify(cutobj));
        //volumes = [nVol];
        GeneratePaperPaths(volumes);
        volumes.forEach(function(vol){
          vol.PaperPath.closed = true;
          vol.PaperPath.smooth({ type: 'catmull-rom', factor: 0.5 });
          //vol.PaperPath.smooth({ type: 'continuous' });
        })
        
        PaperToEasel(volumes);
        volumes.forEach(function(vol){
          delete vol.PaperPath;
        });
        volumes.unshift(background);
      }
      
      // Resize to fit within bounds
    	var bounds = EASEL.volumeHelper.boundingBox(volumes);
    	var scaler = Math.min(Math.min(Proj_MaxHeight / bounds.height, 1), Math.min(Proj_MaxWidth / bounds.width, 1));
    	
    	volumes.forEach(function(vol) {
    	  vol.shape.width *= scaler;
    	  vol.shape.height *= scaler;
    	  vol.shape.center.x = vol.shape.center.x * scaler - bounds.left * scaler;
    	  vol.shape.center.y = vol.shape.center.y * scaler - bounds.bottom * scaler;
    	})
    	
    	success(volumes);
    	return true;
    	
    };
    