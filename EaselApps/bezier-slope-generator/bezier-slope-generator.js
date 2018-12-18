    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = function(args) {
      var material = args.material;
      var materialHeight = material.dimensions.z;
      
      var props = [
        {type: 'range', id: "Height", value: 5, min: 0, max: 10, step: 0.001},
        {type: 'range', id: "Length", value: 5, min: 0, max: 10, step: 0.001},
        {type: 'range', id: "Depth", value: materialHeight, min: 0, max: materialHeight, step: 0.001},
        {type: 'range', id: "Steps", value: 20, min: 1, max: 100, step: 1},
        {type: 'boolean', id: "Flip", value: true},
        {type: 'range', id: "Bezier_P1", value: 0, min: 0, max: 1, step: 0.01},
        {type: 'range', id: "Bezier_P2", value: 0, min: -2, max: 2, step: 0.01},
        {type: 'range', id: "Bezier_P3", value: 1, min: 0, max: 1, step: 0.01},
        {type: 'range', id: "Bezier_P4", value: 1, min: -2, max: 2, step: 0.01}
      ];
      
      return props;
    };

    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args.params;
      var material = args.material;
      var volumes = [];
      var i;
      var Height = params["Height"];
      var Length = params["Length"];
      var Depth  = params["Depth"];
      var Steps   = params["Steps"];
      var Flip    = params["Flip"];
      
      var easing = BezierEasing(params["Bezier_P1"], params["Bezier_P2"], params["Bezier_P3"], params["Bezier_P4"]);
      
      var rect_height = Height;
      var rect_length = Length;
      
      var cx = rect_height / 2;
      var cy = rect_length / 2;
      
      var length_offset = Length / Steps;
      
      var curr_depth = 0;
      if(Flip) {curr_depth = Depth;}
      
      for( i = -1; i < Steps; i += 1 ) {
        var bezier_in = (i + 1) / Steps;
        var bezier_out = easing(bezier_in);
        
        rect_length = Length - length_offset * (i + 1);
        curr_depth = Depth * bezier_out;
        if(Flip) {curr_depth = Depth - Depth * bezier_out;}
        
        // depth cannot be greater than material depth nor less than 0;
        if(curr_depth >= Depth) {curr_depth = Depth;}
        if(curr_depth <= 0) {curr_depth = 0;}
        
        volumes.push({ shape: { type: "rectangle", center: { x: rect_length / 2, y: rect_height / 2 }, width: rect_length, height: rect_height, flipping: {}, rotation: 0 }, cut: { depth: curr_depth, type: 'fill' } });
        
        //volumes.push({ shape: { type: "ellipse", center: { x: cx, y: cy }, width: dia, height: dia, flipping: {}, rotation: 0 }, cut: { depth: depth, type: 'fill' } });
      }

      success(volumes);
    };
