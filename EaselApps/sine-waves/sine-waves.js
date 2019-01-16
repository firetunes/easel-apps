  // Credit to Bill Bucket for original code.
    
    var CircleTemplate = {
      shape: {
        type: "ellipse",
        center: {
          x: 0,
          y: 0
        },
        flipping: {},
        width: 1,
        height: 1,
        rotation: 0
      },
      cut: {
        depth: 0.001,
        type: 'fill',
        outlineStyle: 'on-path',
        tabPreference: false
      }
    };
      
    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = [
      {type: 'range', id: "Tool Width [inches]", value: 0.25, min: 0.05, max: 0.5, step: 0.01},
      {type: 'range', id: "Inner Radius [inches]", value: 0.5, min: 0, max: 29, step: 0.1},
      {type: 'range', id: "Outer Radius [inches]", value: 3, min: 0.5, max: 30, step: 0.1},
      {type: 'range', id: "Scallop Height [mils]", value: 10, min: 0.1, max: 40, step: 0.1},
      {type: 'range', id: "Minimum Stepover [%]", value: 5, min: 1, max: 100, step: 1},
      {type: 'range', id: "Sin(Pi) Depth %", value: 70, min: 0, max: 100, step: 1},
      {type: 'range', id: "Sin(0) Depth %", value: 20, min: 0, max: 100, step: 1},
      {type: 'range', id: "Cycles", value: 2, min: 0.1, max: 10, step: 0.1}
    ];

    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args.params;
      var materialHeight = args.material.dimensions.z;
      var InnerRadius = params["Inner Radius [inches]"];
      var OuterRadius = params["Outer Radius [inches]"];
      var ToolWidth = params["Tool Width [inches]"];
      var MinStep = params["Minimum Stepover [%]"]/100;
      var ScallopHeight = params["Scallop Height [mils]"];
      var Cycles = params["Cycles"];
      var MaxDepth = params["Sin(Pi) Depth %"]/100 * materialHeight;
      var MinDepth = params["Sin(0) Depth %"]/100 * materialHeight;
      var CutRange = MaxDepth - MinDepth;
      
      var volumes = [];
      var tmpVolume;
      var XCenter = OuterRadius;
      var YCenter = OuterRadius;
      
      var CurrentRadius = 0;
      var TravelRadius = (OuterRadius - InnerRadius);
      
      CurrentRadius = TravelRadius
      //while ((CurrentRadius+ToolWidth) < TravelRadius)
      while((CurrentRadius + ToolWidth) > ToolWidth)
      {
        var RatioComplete = (CurrentRadius/TravelRadius);
        
        // Calculate the slope at the point in the carve
        var Slope = Math.tan(Math.sin( (RatioComplete) * Cycles * Math.PI + Math.PI/2));
        
        // The step over depends on the desired scallop height, tool diameter, and the current slope
        var StepOver =  Math.sqrt(((ToolWidth^2)/4)-((ToolWidth/2)-(ScallopHeight/1000))^2) * 2*Math.cos(Slope);
        
        StepOver = Math.min(StepOver,ToolWidth*MinStep);
        
        //CurrentRadius += StepOver;
        CurrentRadius -= StepOver;
        
        // The radius for this isoline depends on the current radius ad the step over.
        var ShapeRadius = CurrentRadius + InnerRadius + ToolWidth / 2;
        
        // The depth depends on how far through the total steps we are and how
        // many cycles need to fit inside those steps; ride the waves
        var ShadeValue = Math.abs(Math.sin( (RatioComplete) * Cycles * Math.PI + Math.PI/2)) * CutRange + MinDepth;
        
        // Full 360 degree arcs can't be made with the 'a' command, so these
        // arcs fall 0.0001 units short of a complete circle, close enough to
        // close without an artifact.
        // A circle object would be filled and we don't want that
        if( ShapeRadius > 0 && ShadeValue > 0 && ShadeValue < materialHeight) {
          tmpVolume = JSON.parse(JSON.stringify(CircleTemplate));
          tmpVolume.shape.center.x = XCenter;
          tmpVolume.shape.center.y = YCenter;
          tmpVolume.shape.width = ShapeRadius * 2;
          tmpVolume.shape.height = ShapeRadius * 2;
          tmpVolume.cut.depth = ShadeValue;
          
          volumes.push(tmpVolume);
        }
      }
      
      if(InnerRadius > 0 && MaxDepth < materialHeight) {
        tmpVolume = JSON.parse(JSON.stringify(CircleTemplate));
        tmpVolume.shape.center.x = XCenter;
        tmpVolume.shape.center.y = YCenter;
        tmpVolume.shape.width = InnerRadius * 2;
        tmpVolume.shape.height = InnerRadius * 2;
        tmpVolume.cut.depth = MaxDepth;
        
        volumes.push(tmpVolume);
      }
      
      success(volumes);
    };
