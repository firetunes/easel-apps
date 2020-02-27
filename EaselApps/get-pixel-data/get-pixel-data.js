    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/paper-full.min.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/paper-easel-api.js');
    importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/PNG.js');
    
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
        
        var options = "resize=height:512,width:512,fit:max/monochrome/output=f:png/";
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
    
    var properties = function(args) {
      var props = [
        {type: 'file-input', id: "File"}
      ];
      
      return props;
    };
    
    var executor = function(args, success, failure) {
      var params = args.params;
      var file = params["File"];
      
      if(file) {
        if(file == prevFile) {
          // Don't reload the image
          console.log("Load Prev");
          setTimeout(function(){ 
            executer_processimage(args, success, failure, fauxPNG); 
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
        switch(png.colorType) {
          case 0: break;
          case 2: var idx = 0; png.pixels.forEach(function(pixel){ rgba.push(pixel); idx++; if(idx === 3){ rgba.push(255); idx = 0; }}); break;
          case 3: png.pixels.forEach(function(pixel){ rgba.push(png.palette[pixel], png.palette[pixel+1], png.palette[pixel+2], 255); }); break;
          case 4: break;
          case 6: rgba = png.pixels; break;
        }
        fauxPNG = {width: png.width, height: png.height, pixels: Array.prototype.slice.call(rgba), colorType: 6};
        
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
        
        executer_processimage(args, success, failure, fauxPNG);
      });
      
      return failure("Loading Image"); 
    };
    
    var executer_processimage = function(args, success, failure, png) {
      console.log(png);
      return failure("Image Parsed");
    };