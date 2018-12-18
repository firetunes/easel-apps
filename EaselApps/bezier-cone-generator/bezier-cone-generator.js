    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = function(args) {
      var material = args.material;
      var materialHeight = material.dimensions.z;
      
      var props = [
        {type: 'range', id: "Max_Diameter", value: 10, min: 0, max: 10, step: 0.001},
        {type: 'range', id: "Min_Diameter", value: 1, min: 0, max: 10, step: 0.001},
        {type: 'range', id: "Height", value: materialHeight, min: 0, max: materialHeight, step: 0.001},
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
      var Max_Dia = params["Max_Diameter"];
      var Min_Dia = params["Min_Diameter"];
      var Height  = params["Height"];
      var Steps   = params["Steps"];
      var Flip    = params["Flip"];
      
      var cx = 0;
      var cy = 0;
      
      var easing = BezierEasing(params["Bezier_P1"], params["Bezier_P2"], params["Bezier_P3"], params["Bezier_P4"]);
      
      var dia_offset = (Max_Dia - Min_Dia) / Steps;
      var depth_offset = Height / Steps;
      
      var dia = Max_Dia;
      var depth = 0;
      if(Flip) {depth = Height;}
      for( i = -1; i < Steps; i += 1 ) {
        var bezier_in = (i + 1) / Steps;
        var bezier_out = easing(bezier_in);
        
        dia = Max_Dia - dia_offset * (i + 1);
        depth = Height * bezier_out;
        if(Flip) {depth = Height - Height * bezier_out;}
        
        // depth cannot be greater than material depth nor less than 0;
        if(depth >= Height) {depth = Height;}
        if(depth <= 0) {depth = 0;}
        
        volumes.push({ shape: { type: "ellipse", center: { x: cx, y: cy }, width: dia, height: dia, flipping: {}, rotation: 0 }, cut: { depth: depth, type: 'fill' } });
      }

      success(volumes);
    };
