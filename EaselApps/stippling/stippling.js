    importScripts('https://d3js.org/d3.v4.min.js');
    
    var timeout = null;
    var lasttime = performance.now();
    
    var material;
    var volumes = [];
    
    var process = false;
    var reset = false;
    
    var prevFile = null;
    var ImageData = null;
    var fauxPNG = null;
    
    var capacity = 15;
	  var invert = false;
	  var calc = 0;
    var iterations = 0;
    var sites;
    var voronoi;
    var diagram;
    var points = [];
    var swaps = 0;
    
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
    
    function ResetParameters() {
      volumes = [];
      points = [];
    }
    
     var properties = function(args) {
      var props = [
        {type: 'file-input', id: "File"},
        {type: "boolean", id: "Reset", value: false},
        {type: 'range', id: "Capacity", value: capacity, min: 3, max: 50, step: 1},
        {type: "boolean", id: "Run Program", value: false},
      ];
      return props;
    };
    
    /*********** RUNS ANYTIME A USER CHANGES AN INPUT ***********/
    var executor = function(args, success, failure) {
      var params = args.params;
      var file = params["File"];
      material = args.material;
      
      
      if(file) {
        if(file == prevFile) {
          /*********** IMAGE ALREADY LOADED ***********/
          setTimeout(function(){ executor1(args, success, failure); }, 5);
        } else {
          /*********** RESET PARAMETERS ***********/
          ResetParameters();
        
          /*********** LOAD IMAGE FIRST ***********/
          getImgData(file, function(imgData) {
            ImageData = imgData;
            fauxPNG = {width: ImageData.width, height: ImageData.height, pixels: Array.prototype.slice.call(ImageData.data), colorType: 6};
            
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
            
            setTimeout(function(){ executor1(args, success, failure); }, 5);
          });
          
        }
        prevFile = file;
      } else {
        failure("Please upload an image");
      }
    };
    
    /*********** RUNS ANYTIME A USER CHANGES AN INPUT, CALLED FROM EXECUTOR ***********/
    function executor1(args, success, failure) {
      var params = args.params;
      var reset = params.Reset;
      var newCapacity = params.Capacity;
      process = params["Run Program"];
      
      if(capacity != newCapacity) {
        if(reset) {
          capacity = newCapacity;
        } else {
          return failure("Reset must be checked before capacity can be changed. Original Value: " + capacity);
        }
      } 
      
      
      /*********** RESET CALCULATED PARAMETERS ***********/
      if(reset === true) {
        ResetParameters();
        process = false;
        return failure("Program in Reset mode. Please uncheck 'Reset' to continue.");
      } 
      
      /*********** INITIALIZE PROCESSING ***********/
      if(process) { processor(args, success, failure); }
      
      /*********** DISPLAY RESULTS TO USER ***********/
      if(volumes.length < 1) {
        return failure("Waiting to start");
      } else {
        if(process) {
          return failure("Initializing...");
        } else {
          return success(volumes);
        }
      }
    }
    
    function processor(args, success, failure) {
      
      /*********** ONLY PROCESS IF ALLOWED ***********/
      if(process) {
        /*********** DO CALCULATIONS ***********/
        ProcessVolumes();
        
        /*********** GIVE USER FEEDBACK ***********/
        failure("Iteration # " + iterations + ": " + swaps + " swaps, " + calc + " distances computed.");
        
        
        /*********** DEBUG INFORMACION ***********/
        //let curtime = performance.now();
        //console.log(volumes.length, (curtime - lasttime));
        //lasttime = curtime;
        
        /*********** RUN AGAIN AS SOON AS POSSIBLE ***********/
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          processor(args, success, failure);
        }, 10);
      }
    }

    function ProcessVolumes() {
      iterations ++;
      if(points.length < 1){
        GeneratePoints();
      } 
      
      /*********** UPDATE STIPPLING ***********/
      swaps = iterate();
      diagram = voronoi(sites);
      sites = sites.map(function (site, i) {
        var pts = points.slice(i * capacity, i * capacity + capacity);
        site[0] = d3.mean(pts.map(function (d) {
          return d[0];
        }));
        site[1] = d3.mean(pts.map(function (d) {
          return d[1];
        }));
        return site;
      });
      
      var elements = [];
      sites.forEach(function(site) {
        elements.push({
          shape: {
            type: "ellipse",
            center: {
              x: site[0],
              y: site[1] * -1
            },
            flipping: {},
            width: 3,
            height: 3,
            rotation: 0
          },
          cut: {
            depth: material.dimensions.z,
            type: 'fill',
            outlineStyle: 'on-path',
            tabPreference: false
          }
        });
      });
      
      volumes = elements;
    }
    
    function GeneratePoints() {
      var Sampl_Invert = false;
      var Sampl_ClipMin = 0;
      var Sampl_ClipMax = 1;
      points = [];
      var factor = 1;
      for (var i = 0; i < fauxPNG.pixels.length; i += 4) {
			  var rnd = Math.random();
			  var clr_val = (fauxPNG.pixels[i] + fauxPNG.pixels[i + 1] + fauxPNG.pixels[i + 2]) / (3 * 256);
			  if(Sampl_Invert) { clr_val = 1 - clr_val;}
				if (rnd > clr_val && clr_val >= Sampl_ClipMin && Sampl_ClipMax >= clr_val) {
					var y = Math.floor(i / 4 / fauxPNG.width);
					var x = (i / 4) - y * fauxPNG.width;
					points.push([x * factor, y * factor]);
				}
      }
      
      const npoints = Math.floor(points.length / capacity);
      sites = d3.range(npoints).map(function (d) {
        var p = points[Math.floor(Math.random() * points.length)];
        p.index = d;
        return p;
      });
      
      voronoi = d3.voronoi().size([fauxPNG.width, fauxPNG.height]);
      diagram = voronoi(sites);
      
      calc = 0;
      iterations = 0;
    }
    
  	function distance2(a, b) {
  		var dx = a[0] - b[0];
  		var dy = a[1] - b[1];
  		return /*Math.sqrt*/ (dx * dx + dy * dy);
  	}
  		
  	function iterate() {
  		var swaps = 0;
  		iterations++;
  
  		var links = new Array(sites.length);
  		diagram.links().forEach(function (l) {
  			var ext = d3.extent([l.source.index, l.target.index]),
  				i = ext[0],
  				j = ext[1];
  			if (!links[i]) links[i] = [j];
  			else links[i].push(j);
  		});
  
  		for (var i in links) {
  			var l = links[i];
  			/* if (false)  */
  			links[i] = d3.merge([links[i]].concat(links[i].map(function (j) {
  				return links[j] || [];
  			})));
  
  			l.forEach(function (j) {
  				var Hi = [],
  					Hj = [],
  					k, ki, kj;
  				for (k = 0; k < capacity; k++) {
  					Hi.push(distance2(points[i * capacity + k], sites[j]) - distance2(points[i * capacity + k], sites[i]));
  					Hj.push(distance2(points[j * capacity + k], sites[i]) - distance2(points[j * capacity + k], sites[j]));
  
  					calc++;
  				}
  
  				while (Hi.length > 0 && Hj.length > 0 && ((ki = d3.scan(Hi)) || true) && ((kj = d3.scan(Hj)) || true) && (Hi[ki] + Hj[kj] < 0)) {
  					swaps++;
  					var temp = points[i * capacity + ki];
  					points[i * capacity + ki] = points[j * capacity + kj];
  					points[j * capacity + kj] = temp;
  					Hi = Hi.slice(0, ki).concat(Hi.slice(ki + 1));
  					Hj = Hj.slice(0, kj).concat(Hj.slice(kj + 1));
  				}
  			});
  		}
  
  		return swaps;
  	}