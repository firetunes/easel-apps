    var timeout = null;
    var gfonts = JSON.parse(gfonts_json);
    var selectedfont;
    var loadedfont;
    
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
    
    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = function(args) {
      var material = args.material;
      var materialHeight = material.dimensions.z;
      selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      
			var fontlist = [];
			for( var f in gfonts) {
				for(var v in gfonts[f].variants) {
					for(var w in gfonts[f].variants[v]) {
						fontlist.push(f + " - " + v + " - " + w);
					}
				}
			}
      
      var props = [
        {type: 'text', id: "Font URL", value: ""},
        {type: 'list', id: "Cut Type", value: "fill", options: ["fill", "outline"]},
        {type: 'list', id: "Font", value: fontlist[0], options: fontlist},
        {type: 'range', id: "Font Size", value: 1, min: 0, max: 10, step: 0.1},
        {type: 'text', id: "Text", value: "Hello World"},
        {type: 'boolean', id: "Isolate Text", value: false}
      ];
      
      return props;
    };

    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    
    var executor = function(args, success, failure) {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        executor2(args, success, failure);
      }, 250);
    }

    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor2 = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      var volumes = [];
      
      // Need to load font for use
      if(selectedfont != params["Font"]) {
			  // gfonts["ABeeZee"]["variants"]["italic"]["400"]["url"]["ttf"]
			  
        selectedfont = params["Font"];
        var fontselector = params["Font"].split("-");
        var fonturl = gfonts[fontselector[0].trim()]["variants"][fontselector[1].trim()][fontselector[2].trim()]["url"]["ttf"];
        //console.log(params["Font URL"], params["Font URL"] !== "");
        if(params["Font URL"] !== "") {
          fonturl = params["Font URL"];
        }
        fonturl = fonturl.replace("http://", "https://");
        console.log(fonturl);
        opentype.load(fonturl, function(err, font) {
          if (err) {
            console.log(err);
            failure("Could not load font"); return false;
          } else {
            loadedfont = font;
            executor(args, success, failure);
          }
        });
        
        failure("Font Loading"); return false;
      }
      if (loadedfont === null){ failure("Font Loading"); return false; }
      
      
      // Font is loaded, get svg path:
      var TextPath = loadedfont.getPath(params["Text"], 0, 0, params["Font Size"]);
      var TextSVG = TextPath.toPathData();
      var TextShape = EASEL.pathUtils.fromSvgPathDataString(TextSVG);
      TextShape.shape.flipping.vertical = true;
      
      var width = 2;
      var height = 2;
      var radius = 1;
      volumes.push({
        shape: TextShape.shape,
        cut: {
          depth: material.dimensions.z,
          type: 'fill',
          outlineStyle: 'on-path',
          tabPreference: false
        }
      });
      success(volumes);
    };
