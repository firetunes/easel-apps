    var timeout = null;
    //var textures = JSON.parse(textures_json);
    var textures = textures_json;
    var targetVolume;
    
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
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      targetVolume = selectedVolumes[0];
      
			var texturelist = [];
			for( var t in textures) {
			  texturelist.push(t);
			}
      
      var props = [
        {type: 'list', id: "Texture", value: texturelist[0], options: texturelist},
        {type: 'text', id: "Custom Texture", value: ""},
        {type: 'range', id: "Scale X", value: 1, min: 0.1, max: 10, step: .1},
        {type: 'boolean', id: "Scale Y = Scale X", value: true},
        {type: 'range', id: "Scale Y", value: 1, min: 0.1, max: 10, step: .1},
        {type: 'range', id: "Rotate", value: 0, min: -180, max: 180, step: 1},
        {type: 'range', id: "X Translate", value: 0, min: -50, max: 50},
        {type: 'range', id: "Y Translate", value: 0, min: -50, max: 50},
        {type: 'range', id: "X Padding", value: 0, min: -50, max: 200},
        {type: 'range', id: "Y Padding", value: 0, min: -50, max: 200},
        {type: 'range', id: "Texture Offset", value: 0, min: -.1, max: .1, step: 0.001},
        {type: 'range', id: "Texture Margin", value: 0, min: 0, max: 1, step: 0.001},
        {type: 'range', id: "Source Depth", value: 0, min:0, max:material.dimensions.z, step:0.001},
        {type: 'range', id: "Texture Depth", value: material.dimensions.z, min:0, max:material.dimensions.z, step:0.001},
        {type: 'boolean', id: "Randomize Texture", value: false}
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
      
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      if(selectedVolumes.length > 1) {failure("Please select only 1 shape."); return false;}
      
      //"rectangle", "ellipse", "polygon", "path", "polyline", "line", "drill"
      if(selectedVolumes[0].shape.type == "drill" || selectedVolumes[0].shape.type == "line") {
        failure("Selected shape cannot be textured.");
        return false;
      }
      
      var pathData = textures[params["Texture"]];
      if(params["Custom Texture"] !== "") {pathData = params["Custom Texture"];}
      if(params["Scale Y = Scale X"]) {params["Scale Y"] = params["Scale X"];}
      
      params["Source Depth"] = Math.max(Math.min(params["Source Depth"], material.dimensions.z), 0);
      params["Texture Depth"] = Math.max(Math.min(params["Texture Depth"], material.dimensions.z), 0);
      
      var volumes_pattern = [];
      var volumes = [];
      
      var cPoints = EASEL.pathToControlPoints(EASEL.pathStringParser.parse(pathData));
      var pathVolume = EASEL.pathUtils.fromPointArrays(cPoints);
      
      var path_bb = EASEL.volumeHelper.boundingBox([pathVolume]);
      var target_bb = EASEL.volumeHelper.boundingBox([targetVolume]);
      targetVolume.shape.rotation += (Math.PI / 180) * params["Rotate"];
      
      targetVolume.cut.depth = params["Source Depth"];
      var cutObj = { depth: params["Texture Depth"], type: 'fill', outlineStyle: 'on-path', tabPreference: false };
      
      var X_Padding = path_bb.width * params["X Padding"] / 100;
      var Y_Padding = path_bb.height * params["Y Padding"] / 100;
      
      var pattern_cols = Math.ceil(target_bb.width / ((path_bb.width + X_Padding) * params["Scale X"])) + 2;
      var pattern_rows = Math.ceil(target_bb.height / ((path_bb.height + Y_Padding) * params["Scale Y"])) + 2;
      
      for(var i = 0; i < pattern_cols; i++) {
        for(var j = 0; j < pattern_rows; j++) {
          var vol_clone = JSON.parse(JSON.stringify(pathVolume));
          vol_clone.shape.center.x = (pathVolume.shape.width + X_Padding) * (i - 1);
          vol_clone.shape.center.y = (pathVolume.shape.height + Y_Padding) * (j - 1);
          if(params["Randomize Texture"]) {
            var angle = (Math.PI / 2) * Math.floor(Math.random() * 3);
            vol_clone.shape.rotation = angle;
          }
          volumes_pattern.push(vol_clone);
        }
      }
      
      targetVolume.shape.rotation -= (Math.PI / 180) * params["Rotate"];
      
      // ctIntersection:0,ctUnion:1,ctDifference:2,ctXor:3}
      var volume_texture = EASEL.volumeHelper.intersect(volumes_pattern, volumes_pattern, 1);
      var texture_bb = EASEL.volumeHelper.boundingBox([volume_texture]);
      volume_texture.shape.width  *= params["Scale X"];
      volume_texture.shape.height *= params["Scale Y"];
      volume_texture.shape.center.x = (target_bb.left + target_bb.right) / 2 + (pathVolume.shape.width * params["Scale X"] * params["X Translate"] / 100);
      volume_texture.shape.center.y = (target_bb.top + target_bb.bottom) / 2 + (pathVolume.shape.height * params["Scale Y"] * params["Y Translate"] / 100);
      volume_texture.shape.rotation = (Math.PI / 180) * params["Rotate"];
      
      var volume_offset = EASEL.volumeHelper.expand([volume_texture], params["Texture Offset"]);
      var target_offset = EASEL.volumeHelper.expand([targetVolume], params["Texture Margin"] * -1);
      var volume_textured = EASEL.volumeHelper.intersect([target_offset], [volume_offset], 0);
      
      volume_textured.cut = cutObj;
      
      volumes = [targetVolume, volume_textured];
      
      
      success(volumes);
    };
