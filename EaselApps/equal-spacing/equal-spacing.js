    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    
    var i;
    var j;
    var properties = [
      {type: 'list', id:"Spacing Type", value: "Vertical", options:["Vertical", "Horizontal", "Both"]},
      {type: 'range', id:"Additional Spacing", value: 0, max: 1, min: -1, step: 0.01},
      {type: 'boolean', id:"Use Specific Spacing", value: false},
      {type: 'range', id:"Specify Spacing", value: 0, max: 10, min: 0, step: 0.01}
    ];
    
    var getSelectedVolumes = function(volumes, selectedVolumeIds) {
      var selectedVolumes = [];
      var volume;
      for (i = 0; i < volumes.length; i++) {
        volume = volumes[i];
        if (selectedVolumeIds.indexOf(volume.id) !== -1) {
          selectedVolumes.push(volume);
        }
      }
      return selectedVolumes;
    };
    
    function compare_x(a,b) {
      if (a.shape.center.x < b.shape.center.x)
        return -1;
      if (a.shape.center.x > b.shape.center.x)
        return 1;
      return 0;
    }
    
    function compare_y(a,b) {
      if (a.shape.center.y < b.shape.center.y)
        return -1;
      if (a.shape.center.y > b.shape.center.y)
        return 1;
      return 0;
    }

    // Define an executor function that builds an array of volumes,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args.params;
      var selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      
      
      if(selectedVolumes.length < 3) {
        failure("Please select 3 or more shapes");
        return false;
      }
      var Max_X, Min_X, Max_Y, Min_Y, selectedVolumes_sorted, tmpx, tmpy;
      Max_X = selectedVolumes[0].shape.center.x;
      Min_X = selectedVolumes[0].shape.center.x;
      Max_Y = selectedVolumes[0].shape.center.y;
      Min_Y = selectedVolumes[0].shape.center.y;
      for(i = 1; i < selectedVolumes.length; i++) {
        tmpx = selectedVolumes[i].shape.center.x;
        tmpy = selectedVolumes[i].shape.center.y;
        
        if(tmpx > Max_X) {Max_X = tmpx;}
        if(tmpx < Min_X) {Min_X = tmpx;}
        if(tmpy > Max_Y) {Max_Y = tmpy;}
        if(tmpy < Min_Y) {Min_Y = tmpy;}
      }
      selectedVolumes_sorted = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      
      if(params["Spacing Type"] == "Vertical" || params["Spacing Type"] == "Both") {
        
        selectedVolumes_sorted.sort(compare_y);
        
        for(i = 0; i < selectedVolumes_sorted.length; i++) {
          selectedVolumes_sorted[i].shape.center.y = Min_Y + (Max_Y - Min_Y) / (selectedVolumes_sorted.length - 1) * i + params["Additional Spacing"] * i;
          if(params["Use Specific Spacing"]) {
            selectedVolumes_sorted[i].shape.center.y = Min_Y + params["Specify Spacing"] * i;
          }
        }
      } 
      if(params["Spacing Type"] == "Horizontal" || params["Spacing Type"] == "Both") {
        selectedVolumes_sorted.sort(compare_x);
        
        for(i = 0; i < selectedVolumes_sorted.length; i++) {
          selectedVolumes_sorted[i].shape.center.x = Min_X + (Max_X - Min_X) / (selectedVolumes_sorted.length - 1) * i + params["Additional Spacing"] * i;
          if(params["Use Specific Spacing"]) {
            selectedVolumes_sorted[i].shape.center.x = Min_X + params["Specify Spacing"] * i;
          }
        }
      }
      
      for(i = 0; i < selectedVolumes.length; i++) {
        for(j = 0; j < selectedVolumes_sorted.length; j++) {
          if(selectedVolumes[i].id == selectedVolumes_sorted[j].id) {
            selectedVolumes[i].shape.center.x = selectedVolumes_sorted[j].shape.center.x;
            selectedVolumes[i].shape.center.y = selectedVolumes_sorted[j].shape.center.y;
          }
        }
      }
      
      success(selectedVolumes);
    };
