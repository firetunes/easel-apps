    var makerjs = require('makerjs');
    var meapi = require('makerjs-easel-api');
    
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
        //{type: 'file-input', id: "Local Font"},
        //{type: 'text', id: "Font URL", value: ""},
        {type: 'list', id: "Font", value: fontlist[0], options: fontlist},
        {type: 'boolean', id: "Fix Dark Areas in Text", value: false},
        {type: 'range', id: "Font Size", value: 1, min: 0, max: 10, step: 0.1},
        {type: 'text', id: "Text", value: "Hello World"},
        {type: 'range', id: "Depth", value: materialHeight, min: 0, max: materialHeight, step: 0.001},
        {type: 'boolean', id: "Rotate", value: false},
        {type: 'boolean', id: "Reverse", value: false},
        {type: 'boolean', id: "Flip", value: false},
        {type: 'range', id: "Baseline", value: 0, min: -2, max: 2, step: 0.001},
        {type: 'range', id: "Path Start Percent", value: 0, min: 0, max: 100, step: 0.1},
        {type: 'range', id: "Path End Percent", value: 100, min: 0, max: 100, step: 0.1},
        {type: 'boolean', id: "Isolate Text", value: false}
        //{type: 'range', id: "Cycle", value: 0, min: -100, max: 100, step: 1}
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
      }, 500);
    }
    
    
    var executor2 = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      var Depth = params["Depth"];
      var Rotate = params["Rotate"];
      var Baseline = params["Baseline"];
      var LeftStart = params["Path Start Percent"];
      var RightStart = params["Path End Percent"];
      var volumes = [];
      
      // Need to load font for use
      if(selectedfont != params["Font"]) {
			  // gfonts["ABeeZee"]["variants"]["italic"]["400"]["url"]["ttf"]
			  
        selectedfont = params["Font"];
        var fontselector = params["Font"].split("-");
        var fonturl = gfonts[fontselector[0].trim()]["variants"][fontselector[1].trim()][fontselector[2].trim()]["url"]["ttf"];
        //if(params["Font URL"] !== "") {
        //  fonturl = params["Font URL"];
        //}
        opentype.load(fonturl, function(err, font) {
          if (err) {
            failure("Could not load font"); return false;
          } else {
            loadedfont = font;
            executor(args, success, failure);
          }
        });
        
        failure("Font Loading"); return false;
      }
      if (loadedfont === null){ failure("Font Loading"); return false; }
      
      
      var easelPath = selectedVolumes[0].shape;
      var makerPath = meapi.importEaselShape(easelPath);
      var measurementPath = makerjs.measure.modelExtents(makerPath);
      var pathchain = makerjs.model.findSingleChain(makerPath);
      //makerjs.chain.cycle(pathchain, params["Cycle"]);
      
      var i; var j;
      var divisions = 1000;
      var points = makerjs.chain.toPoints(pathchain, pathchain.pathLength / divisions);
      makerjs.chain.reverse(pathchain);
      var lastpoints = makerjs.chain.toPoints(pathchain, pathchain.pathLength);
      points.push(lastpoints[0]);
      makerjs.chain.reverse(pathchain);
  
      var textpoints = [];
      if(LeftStart > RightStart) {RightStart = LeftStart;}
      for(i = LeftStart * 10; i < RightStart * 10; i++) {
        textpoints.push(points[i]);
      }
      var textcurve = new makerjs.models.ConnectTheDots(false, textpoints);
      var newchain = makerjs.model.findSingleChain(textcurve);
      makerjs.chain.reverse(newchain);
      
      var RenderOptions = {
        kerning: true,
        features: {
          liga: true,
          rlig: true
        }
      };
      
      var textModel = new makerjs.models.Text(loadedfont, params["Text"], params["Font Size"], false, true, 0.001, RenderOptions);
      if(params["Flip"]) {
        textModel = makerjs.model.mirror(textModel, false, true);
      }
      makerjs.layout.childrenOnChain(textModel, newchain, Baseline, params["Reverse"], true, Rotate);
      
      var models = {};
      models.row = {
        model: textModel,
        cut: {type: "fill", depth: Depth},
        origin: [0,0]
      };
      
      var svgmodels = {models: {}};
      var modelitr = 0;
      if(params["Fix Dark Areas in Text"]) {
        for (var key1 in models) {
          if (models.hasOwnProperty(key1)) {
            var model1 = models[key1].model;
            var chains = makerjs.model.findChains(model1);
            for (var ch in chains) {
              var nmodel = makerjs.chain.toNewModel(chains[ch]);
              
              svgmodels.models[modelitr] = {
                model: nmodel,
                cut: JSON.parse(JSON.stringify(models[key1].cut))
              }
              modelitr++;
            }
          }
        }
        
        for(var A in svgmodels.models) {
          var measureA = makerjs.measure.modelExtents(svgmodels.models[A].model);
          for(var B in svgmodels.models) {
            if(A != B) {
              var measureB = makerjs.measure.modelExtents(svgmodels.models[B].model);
              var top_in = (measureA.high[1] < measureB.high[1]);
              var bot_in = (measureA.low[1] > measureB.low[1]);
              var right_in = (measureA.high[0] < measureB.high[0]);
              var left_in = (measureA.low[0] > measureB.low[0]);
              if(top_in && bot_in && right_in && left_in) {
                svgmodels.models[A].cut.depth = 0;
              }
            }
          }
          
        }
      } else {
        svgmodels.models["Text"] = models.row;
      }
      
      
      if(!params["Isolate Text"]) {
        volumes = args.volumes;
      }
      
      for (var key in svgmodels.models) {
        var measurement = makerjs.measure.modelExtents(svgmodels.models[key].model);
        var allPoints = meapi.exportModelToEaselPointArray(svgmodels.models[key].model);
        var volume = {
          shape: {
            type: "path",
            points: allPoints,
            flipping: {},
            center: {
              x: measurement.center[0] + easelPath.center.x - measurementPath.width / 2,
              y: measurement.center[1] + easelPath.center.y - measurementPath.height / 2
            },
            width: measurement.width,
            height: measurement.height,
            rotation: 0
          }
        }; 
        volume.cut = svgmodels.models[key].cut;
        volumes.push(volume);
      }
      
      success(volumes);
    };
