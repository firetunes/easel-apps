    function toDataUrl(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            }
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    }
    
    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = function(args) {
      var props = [
        {type: 'file-input', id: "File"}
      ];
      
      return props;
    };
    

    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      
      var file = params["File"];
      if(file) {
        toDataUrl(file, function(myBase64) {
          executer2(args, success, failure, myBase64);
        });
      } else {
        failure("Please upload an image");
      }
      
  
    };
    
    
    var executer2 = function(args, success, failure, imgBase64) {
      var volumes = [];
      var circle = { shape: { type: 'ellipse', anchored: false, center: {x: 0, y: 0}, width: 1, height: 1, fipping: {}, rotation: 0}, cut: {depth: 0.1, type: 'fill', outlineStyle: 'on-path',tabPreference: false, useProfile: false}};
      
      var image = new PNG(imgBase64.replace("data:image/png;base64,", ""));
      var targetWidth = 5;
      var scale_factor = targetWidth / image.width;
      
      circle.shape.width = scale_factor;
      circle.shape.height = scale_factor;
      
      var line;
      var y = 0;
      while(line = image.readLine()){
        for(var x = 0; x < line.length; x ++){
          var px = line[x]; // Pixel RGB color as a single numeric value
          var vol_clone = JSON.parse(JSON.stringify(circle));
          vol_clone.shape.center.x = x * scale_factor;
          vol_clone.shape.center.y = y * scale_factor;
          volumes.push(vol_clone);
          //console.log(x, px);
          // white pixel == 0xFFFFFF
        }
        y++;
      }
      

      console.log(volumes,image.width,image.height);
      failure("stop"); return false;
      success(volumes);
      //var drills = [];
      //drills.push({  shape: {  type: "drill", anchored: false, center: { x: 0, y: 0 }, flipping: {}, isProportionLocked: false },  cut: {  depth: 0.25, type: "drill" } });
      //success(drills);
    };
    
    