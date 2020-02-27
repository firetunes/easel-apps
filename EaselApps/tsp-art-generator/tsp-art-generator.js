    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/paper-full.min.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/paper-easel-api.js');
    
    paper.install(this);
    paper.setup([100, 100]);
    
    var timeout = null;
    var prevFile = null;
    var LoadedImageData = null;
    
    let ToggleOptimize = false;
    
    let unvisited = [];
		let tour = [];
    
    function getImgData(url, callback) {
      fetch(url)
        .then(response => response.blob())
        .then(blob => createImageBitmap(blob))
        .then(function(imageBitmap){
          const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imageBitmap, 0, 0);
          const imgdata = ctx.getImageData(0,0,imageBitmap.width, imageBitmap.height);
          callback(imgdata);
        });
    }
    
    var properties = function(args) {
      var props = [
        {type: 'file-input', id: "File"},
        
        // Limits
        {type: 'range', id: "Max Height", value: 12, min: 0, max: 40, step: 1},
        {type: 'range', id: "Max Width", value: 12, min: 0, max: 40, step: 1},
        {type: 'range', id: "Max Hole Qty", value: 1000, min: 100, max: 10000, step: 100},
        
        // Grid
        {type: 'range', id: "Space", value: 15, min: 5, max: 100, step: 1},
        
        // Color Correction
        {type: 'range', id: "Clamp (min)", value: 0.05, min: 0, max: 1, step: 0.05},
        {type: 'range', id: "Clamp (max)", value: 0.95, min: 0, max: 1, step: 0.05},
        {type: 'range', id: "Gamma", value: 1, min: 0.01, max: 2, step: 0.05},
        
        // Sampling Settings
        //{type: 'list', id: "Channel", value: "Black", options: ["None", "Luminance", "Red", "Green", "Blue", "Cyan", "Magenta", "Yellow", "Black"]},
        {type: 'boolean', id: "Invert", value: false},
        {type: 'range', id: "Clip (min)", value: 0, min: 0, max: 1, step: 0.05},
        {type: 'range', id: "Clip (max)", value: 1, min: 0, max: 1, step: 0.05},
        {type: 'range', id: "Strength", value: 1, min: 0, max: 1, step: 0.05},
        
        {type: 'boolean', id: "Optimize Path", value: false},
      ];
      
      return props;
    };

    var executor = function(args, success, failure) {
      if (typeof createImageBitmap === "function" && typeof OffscreenCanvas === "function" ) { 
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          executor0(args, success, failure);
        }, 500);
      } else {
        failure("I'm sorry, this app requires the latest chrome or firefox browser.");
        return false;
      }
    }
    
    var executor0 = function(args, success, failure) {
      var params = args.params;
      var file = params["File"];
      if(file) {
        if(file == prevFile) {
          // Don't reload the image
          setTimeout(function(){ 
            executer2(args, success, failure, LoadedImageData); 
          }, 50);
        } else {
          // Load the image and transform to imageData object
          getImgData(file, function(imgData) {
            var fauxPNG = {width: imgData.width, height: imgData.height, pixels: imgData.data, colorType: 6};
            executer2(args, success, failure, fauxPNG);
          });
        }
        prevFile = file;
      } else {
        failure("Please upload an image");
      }
    };

    var executer2 = function(args, success, failure, png) {
      LoadedImageData = png; // save imagedata for future use
      var rgba = [];
      switch(png.colorType) {
        case 0: break;
        case 2: var idx = 0; png.pixels.forEach(function(pixel){ rgba.push(pixel); idx++; if(idx === 3){ rgba.push(255); idx = 0; }}); break;
        case 3: png.pixels.forEach(function(pixel){ rgba.push(png.palette[pixel], png.palette[pixel+1], png.palette[pixel+2], 255); }); break;
        case 4: break;
        case 6: rgba = png.pixels; break;
      }
      var params = args.params;
      
      var Proj_MaxHeight = params["Max Height"];    // Used
      var Proj_MaxWidth = params["Max Width"];      // Used
      var Proj_MaxHoleQty = params["Max Hole Qty"]; // Used
      
      var Img_Gamma = params["Gamma"];              // Used
      var Img_ClampMin = params["Clamp (min)"];     // Used
      var Img_ClampMax = params["Clamp (max)"];     // Used
      
      var Grid_Space = params["Space"];             // Used
      
      //var Sampl_Channel = params["Channel"];
      var Sampl_Invert = params["Invert"];
      var Sampl_ClipMin = params["Clip (min)"];     // Used
      var Sampl_ClipMax = params["Clip (max)"];     // Used
      var Sampl_Strength = params["Strength"];      // Used
      
      var OptimizePath = params["Optimize Path"];      // Used
      
      var volumes = [];
      var cutobj = {type: "outline", depth: 0.25, outlineStyle: "on-path"};
      var shape_square = {type: "polygon", width: 1, height: 1, points: [{x: 0, y:0},{x: 0, y:1},{x: 1, y:1},{x: 1, y:0}], center: {x: 0, y: 0}, rotation: 0, isProportionLocked: false, flipping: {}};
      var shape_ellipse = {type: "ellipse", width: 1, height: 1, center: {x: 0, y: 0}, rotation: 0, isProportionLocked: false, flipping: {}};
      var shapeobj = shape_ellipse;
      
      var background = {shape: JSON.parse(JSON.stringify(shape_square)), cut: JSON.parse(JSON.stringify(cutobj))};
      background.shape.width = png.width;
      background.shape.height = png.height;
      background.shape.center.x = png.width / 2;
      background.shape.center.y = png.height / 2;
      background.shape.rotation = 0;
      background.cut.depth = 0;
      volumes.push(background);
      
      // Perform Color Correction
      rgba = Array.prototype.slice.call(rgba);
      for (var y = 0; y < png.height; y++) {
    		for(var x = 0; x < png.width; x++) {
          let position = (x + y * png.width) * 4;
          let pixel = JSON.parse(JSON.stringify(rgba.slice(position, position + 4)));
          
          // RGBA to RGB
          let background = 255; // 0 to 255
          pixel[0] = (255 - pixel[3]) / 255 * background + pixel[0] * (pixel[3] / 255);
          pixel[1] = (255 - pixel[3]) / 255 * background + pixel[1] * (pixel[3] / 255);
          pixel[2] = (255 - pixel[3]) / 255 * background + pixel[2] * (pixel[3] / 255);
          
          
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
          
          Array.prototype.splice.apply(rgba, [position, pixel.length].concat(pixel));
    		}
      }
      
      // Create Square Element Array
      let elements = [];
      let hypot = Math.sqrt(Math.pow(png.width,2) + Math.pow(png.height,2));
      let x_elements = Math.floor(hypot / Grid_Space) - ((Math.floor(hypot / Grid_Space) % 2 == 1) ? 0 : 1);
      let y_elements = Math.floor(hypot / Grid_Space) - ((Math.floor(hypot / Grid_Space) % 2 == 1) ? 0 : 1);
      
      let x_offset = (png.width - x_elements * Grid_Space) / 2;
      let y_offset = (png.height - y_elements * Grid_Space) / 2;
      
      for(let i = 0; i <= x_elements; i++) {
        for(let j = 0; j <= y_elements; j++) {
          let point = [i * Grid_Space + x_offset, j * Grid_Space + y_offset];
          point[0] += Math.random() * Grid_Space - Grid_Space / 2;
          point[1] += Math.random() * Grid_Space - Grid_Space / 2;
          
          if((point[0]-Grid_Space/2) >= 0 && (point[0]+Grid_Space/2) <= png.width && (point[1]-Grid_Space/2) >= 0 && (point[1]+Grid_Space/2) <= png.height){
            let nearestpixel = (Math.round(point[0]) + Math.round(point[1]) * png.width) * 4;
            let pixel = rgba.slice(nearestpixel, nearestpixel + 4);
            let lum = Math.max(Math.min(((pixel[0]+pixel[0]+pixel[0]+pixel[1]+pixel[1]+pixel[1]+pixel[1]+pixel[2])>>3) / 255, 1), 0);
            
            elements.push({x: point[0], y: point[1], l: lum});
          }
        }
      }
      
      var trimmedelements = [];
      
      for (var i = 0, len = elements.length; i < len; i++) {
        ele = JSON.parse(JSON.stringify(elements[i]));
        if(ele.l <= (1 - Sampl_ClipMin) && ele.l >= (1 - Sampl_ClipMax)) {
          let scaler = Grid_Space * (1 - ele.l * Sampl_Strength);
      		let vol = {shape: JSON.parse(JSON.stringify(shapeobj)), cut: JSON.parse(JSON.stringify(cutobj))};
      		vol.shape.center.x = ele.x;
      		vol.shape.center.y = ele.y * -1 + png.height;
      		vol.shape.height *= scaler;
        	vol.shape.width *= scaler;
        	
        	if(scaler > 0) {
        	  //volumes.push(vol);
        	  ele.y = ele.y * -1 + png.height;
        	  trimmedelements.push(ele);
        	}
        	if(volumes.length > Proj_MaxHoleQty) {
            failure("Maximum number of holes exceeded. Please adjust parameters.");
            return false;
          }
        }
      }
      
      // 1. Get stipple pixel array
      // 2. getNNTour
      // 3. run2Opt
      
      unvisited = JSON.parse(JSON.stringify(trimmedelements));
      tour = [];
      getNNTour();
      if(OptimizePath != ToggleOptimize) {
        run2Opt();
        ToggleOptimize = OptimizePath;
      }
      //run2Opt();
      
      // create new path:
      //for(let i=0; i<pixel_array.length; i++){  
      //  context.beginPath();
      //  context.moveTo(pixel_array[i].x, pixel_array[i].y);
      //  context.lineTo(pixel_array[(i+1)%pixel_array.length].x, pixel_array[(i+1)%pixel_array.length].y);
      //  context.stroke();
      //}
      
      var nPath = EASEL.pathUtils.fromPointArrays([tour]);
      nPath.cut = cutobj;
      volumes.push(nPath);
      
      
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
    
    
	//Place n random points on canvas
	let getRandomPixels = function() {
		for(let i=0; i<num_pixels; i++){
			let x = Math.floor(Math.random() * 10);
			let y = Math.floor(Math.random() * 10);
			let pixel = {x: x, y: y};
			unvisited.push(pixel);
		}
	}

  let getDistance = function(p1, p2){
		let a = Math.pow(p2.x-p1.x,2);
		let b = Math.pow(p2.y-p1.y,2);
		return Math.sqrt((a+b));
	}

	/*  Returns the given pixel’s nearest neighbor.  Accepts a pixel and an array of unvisited pixels.  */
	let getNearestNeighbor = function(pixel, unvisited){
		let shortestDistance = Infinity;

		//initialize the nearest pixel (the return value) and the nearest index
		let nearest = unvisited[0];
		let nearestIndex = 0;

		for(let i=0; i<unvisited.length; i++){
			let d = getDistance(pixel, unvisited[i]);
    		if(d <= shortestDistance){
    			shortestDistance = d;
    			nearest = unvisited[i];
    			nearestIndex = i;
    		}
		}
		//remove this pixel from the “unvisited” array since it's now been visited
		unvisited.splice(nearestIndex,1);
		return nearest;
	}

	//Finds the NN TSP tour and assigns it to the "tour" variable
	let getNNTour = function() {
		let currPixel = unvisited[0];
		tour.push(currPixel);
		unvisited.splice(0,1);

		 while(unvisited.length > 0){   	
			let closest = (getNearestNeighbor(currPixel, unvisited)); 
			tour.push(closest);
			currPixel = closest;
	    }
	}
	
	
	//Reverses the pixels between two swapped pixels
	let reversePixels = function(p1, p2, tour){
		let newRoute = [];
		for(let j=0; j<p1; j++){	
			newRoute.push(tour[j]);
		}
		for(let n=p2; n>=p1; n--){	
			newRoute.push(tour[n]);
		}
		for(let m=p2+1; m<tour.length; m++){	
			newRoute.push(tour[m]);
		}
		return newRoute;
	}

	//Perform the 2Opt heuristic to optimize a TSP tour
	let run2Opt = function(){
		let change;
		//run the loop until there is no further improvement in the tour length
		do{
			change = false;
			for(let i=1; i<tour.length-1; i++){
				for(let j=i+1; j<tour.length; j++){
					let d1 = getDistance(tour[(i-1)%tour.length], tour[i%tour.length]);
					let d2 = getDistance(tour[j%tour.length], tour[(j+1)%tour.length]);
					let currLen = d1 + d2;

					let d3 = getDistance(tour[(i-1)%tour.length], tour[j%tour.length]);
					let d4 = getDistance(tour[i%tour.length], tour[(j+1)%tour.length]);
					let swappedLen = d3 + d4;
					if(swappedLen < currLen){
						tour = reversePixels(i,j,tour);
						change = true;
					}
				}
			}

		}while(change)
	}