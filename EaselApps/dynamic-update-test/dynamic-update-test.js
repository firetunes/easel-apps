    var timeout = null;
    var lasttime = performance.now();
    
    var material;
    var volumes = [];
    var process = false;
    var reset = false;
    
     var properties = function(args) {
      var props = [
        {type: "boolean", id: "Run Program", value: false},
        {type: "boolean", id: "Reset Volumes", value: false}
      ];
      return props;
    };
    
    var executor = function(args, success, failure) {
      var params = args.params;
      process = params["Run Program"];
      material = args.material;
      
      timer(args, success, failure);
      if(params["Reset Volumes"] === true) {
        volumes = [];
        process = false;
        return failure("Program Reset. Please uncheck 'Reset' to continue.");
      } 
      
      if(volumes.length < 1) {
        return failure("Waiting to start");
      } else {
        if(process) {
          return failure("Adding more shapes...");
        } else {
          return success(volumes);
        }
      }
    };
    
    function timer(args, success, failure) {
      
      /*********** ONLY PROCESS IF ALLOWED ***********/
      if(process) {
        /*********** DO CALCULATIONS ***********/
        ProcessVolumes();
        
        /*********** GIVE USER FEEDBACK ***********/
        if(volumes.length % 50 === 0){
          failure("Number of Shape: " + volumes.length);
        }
        
        
        /*********** DEBUG INFORMACION ***********/
        //let curtime = performance.now();
        //console.log(volumes.length, (curtime - lasttime));
        //lasttime = curtime;
        
        /*********** RUN AGAIN AS SOON AS POSSIBLE ***********/
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          timer(args, success, failure);
        }, 1);
      }
    }

    function ProcessVolumes() {
      volumes.push({
        shape: {
          type: "rectangle",
          center: {
            x: Math.random() * 10,
            y: Math.random() * 10
          },
          flipping: {},
          width: Math.random() * 2,
          height: Math.random() * 2,
          rotation: 0
        },
        cut: {
          depth: material.dimensions.z,
          type: 'outline',
          outlineStyle: 'on-path',
          tabPreference: false
        }
      });
    }