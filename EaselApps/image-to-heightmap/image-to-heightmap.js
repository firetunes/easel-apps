    
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/helper-functions.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/PNG.js');
    
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
        
        var options = "output=f:png/resize=height:1024,width:1024,fit:max/monochrome/";
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
    
    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = function(args) {
      var props = [
        {type: 'file-input', id: "File"},
        
        // Limits
        {type: 'range', id: "Max Height", value: 12, min: 0, max: 40, step: 1},
        {type: 'range', id: "Max Width", value: 12, min: 0, max: 40, step: 1},
        
        {type: 'range', id: "Resolution", value: 5, min: 2, max: 20, step: 1},
        {type: 'range', id: "Layers", value: 10, min:5, max: 100, step: 1},
        
        {type: 'range', id: "Start Depth", value: 0, min: 0, max: args.material.dimensions.z, step: 0.1},
        {type: 'range', id: "End Depth", value: args.material.dimensions.z, min: 0, max: args.material.dimensions.z, step: 0.1},
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
      
      var Layer_Resolution = params["Resolution"];
      var Num_Layers = params["Layers"];
      
      var depth_Start = params["Start Depth"];
      var depth_End = params["End Depth"];
      
      var volumes = [];
      var cutobj = {type: "outline", depth: 0.5, outlineStyle: "on-path"};
      var shape_square = {type: "polygon", width: 1, height: 1, points: [{x: 0, y:0},{x: 0, y:1},{x: 1, y:1},{x: 1, y:0}], center: {x: 0, y: 0}, rotation: 0, isProportionLocked: false, flipping: {}};
      
      var background = {shape: JSON.parse(JSON.stringify(shape_square)), cut: JSON.parse(JSON.stringify(cutobj))};
      background.shape.width = png.width;
      background.shape.height = png.height;
      background.shape.center.x = png.width / 2;
      background.shape.center.y = png.height / 2;
      background.shape.rotation = 0;
      background.cut.depth = 0;
      //volumes.push(background);
      
      var data = [];
      for(let i = 0; i < png.height; i += Layer_Resolution) {
        let dataline = [];
        for(let j = 0; j < png.width; j += Layer_Resolution) {
          let avg = 0;
          avg += png.pixels[j * 4 + png.width * 4 * i + 0];
          avg += png.pixels[j * 4 + png.width * 4 * i + 1];
          avg += png.pixels[j * 4 + png.width * 4 * i + 2];
          avg /= 3;
          dataline.push(avg);
        }
        data.push(dataline);
      }
      var prepData = new MarchingSquaresJS.QuadTree(data.reverse());
      
      var options = {};
      options.polygons = false;
      options.linearRing = true;
      options.noQuadTree = false;
      options.noFrame = true;
      
      //var lowerBound = 20;
      //var upperBound = 255;
      //var bandWidth = upperBound - lowerBound;
      //var band = MarchingSquaresJS.isoBands(prepData, lowerBound, bandWidth, options);
      //console.log(band);
      
      
      for(let i = 0; i < Num_Layers; i++) {
        let lBound = i * (255 / Num_Layers);
        let band = MarchingSquaresJS.isoBands(prepData, lBound, 255 - lBound, options);
        
        var ptArrs = [];
        band.forEach(function(isoband){
          let ptArr = [];
          isoband.forEach(function(pt){
            ptArr.push({x: pt[0], y: pt[1]});
          })
          ptArrs.push(ptArr);
        });
        if(ptArrs.length > 0) {
          let nVol = EASEL.pathUtils.fromPointArrays(ptArrs);
          nVol.cut = JSON.parse(JSON.stringify(cutobj));
          nVol.cut.depth = Math.max(Math.min((1 - lBound / 255), 1), 0) * (depth_End - depth_Start) + depth_Start;
          nVol.cut.type = "fill";
          volumes.push(nVol);
        }
      }
      
      var bounds = EASEL.volumeHelper.boundingBox(volumes);
    	var scaler = Math.min(Math.min(Proj_MaxHeight / bounds.height, 1), Math.min(Proj_MaxWidth / bounds.width, 1));
    	
    	volumes.forEach(function(vol) {
    	  vol.shape.width *= scaler;
    	  vol.shape.height *= scaler;
    	  vol.shape.center.x = vol.shape.center.x * scaler - bounds.left * scaler;
    	  vol.shape.center.y = vol.shape.center.y * scaler - bounds.bottom * scaler;
    	});
    	
      success(volumes);
    };
