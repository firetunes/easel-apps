  /*
  //For development only
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/paper-full.min.js');
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/paper-easel-api.js');
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/PaperPathWarp.js');
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/easel.js');
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/clipper.js');
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/helper-functions.js');
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/polyfill-map.js');
  importScripts('https://cdn.jsdelivr.net/gh/firetunes/easel-apps/EaselApps/_helpers/bezier-easeing.js');
  */
  paper.install(this);
  paper.setup([100, 100]);

  var i;
  var timeout = null;
  var params;
  var material;
  var selectVolumes = [];
  var easing;
  var sDepth, eDepth, Depth, Steps;
  var maxoffset = Infinity;
  var unitconv = 1;

  var properties = function(args) {
      material = args.material;
      //console.log(args);
      var materialHeight = material.dimensions.z;
      unitconv = (args.preferredUnit == "in") ? 1 : 1 / 25.4;
      var props = [{
              type: 'list',
              id: "Units",
              value: args.preferredUnit,
              options: ["in", "mm"]
          },
          {
              type: 'list',
              id: "Curve Type",
              value: "linear",
              options: ["linear", "ease-in", "ease-out", "ease-in-out", "inner-radius", "outer-radius", "custom"]
          },
          {
              type: 'text',
              id: "Custom Curve",
              value: "0,0,1,1"
          },
          {
              type: 'range',
              id: "Start Depth",
              value: 0,
              min: 0,
              max: materialHeight / unitconv,
              step: 0.001
          },
          {
              type: 'range',
              id: "End Depth",
              value: materialHeight / unitconv,
              min: 0,
              max: materialHeight / unitconv,
              step: 0.001
          },
          {
              type: 'range',
              id: "Steps",
              value: 20,
              min: 1,
              max: 100,
              step: 1
          },
      ];

      selectedVolumes = getSelectedVolumes(args.volumes, args.selectedVolumeIds);
      switch (selectedVolumes.length) {
          case 0: // Create Square or Circle Gradient
              props.push({
                  type: 'list',
                  id: "Direction",
                  value: "Inwards",
                  options: ["Inwards", "Left", "Right", "Up", "Down", "Specific Angle"]
              });
              props.push({
                  type: 'range',
                  id: "Angle",
                  value: 0,
                  min: 0,
                  max: 360,
                  step: 1
              });
              props.push({
                  type: 'list',
                  id: "Shape Type",
                  value: "rectangle",
                  options: ["rectangle", "ellipse"]
              });
              props.push({
                  type: 'range',
                  id: "Shape Height",
                  value: 2 / unitconv,
                  min: 0,
                  max: 10 / unitconv,
                  step: 0.001 / unitconv
              });
              props.push({
                  type: 'range',
                  id: "Shape Width",
                  value: 2 / unitconv,
                  min: 0,
                  max: 10 / unitconv,
                  step: 0.001 / unitconv
              });
              props.push({
                  type: 'range',
                  id: "Gradient Length %",
                  value: 100,
                  min: 50,
                  max: 100,
                  step: 1
              });
              props.push({
                  type: 'text',
                  id: "Center Point",
                  value: "0,0"
              });
              break;
          case 1: // Single Shape Gradient
              var defaultangle = 0;
              if (selectedVolumes[0].shape.type == "line" || (selectedVolumes[0].shape.type == "path" && selectedVolumes[0].shape.points.length == 1 && selectedVolumes[0].shape.points[0].length == 2)) {
                  props.push({
                      type: 'range',
                      id: "Shape Height",
                      value: 2 / unitconv,
                      min: 0,
                      max: 10 / unitconv,
                      step: 0.001 / unitconv
                  });
                  props.push({
                      type: 'boolean',
                      id: "Reverse Height",
                      value: false
                  });
                  props.push({
                      type: 'list',
                      id: "Direction",
                      value: "Normal",
                      options: ["Normal", "Reverse Normal", "Inwards", "Left", "Right", "Up", "Down", "Specific Angle"]
                  });
              } else {
                  props.push({
                      type: 'list',
                      id: "Direction",
                      value: "Inwards",
                      options: ["Inwards", "Left", "Right", "Up", "Down", "Specific Angle"]
                  });
              }
              props.push({
                  type: 'range',
                  id: "Angle",
                  value: defaultangle,
                  min: 0,
                  max: 360,
                  step: 1
              });
              props.push({
                  type: 'list',
                  id: "Shape Type",
                  value: "self",
                  options: ["self", "rectangular"]
              });
              props.push({
                  type: 'range',
                  id: "Gradient Length %",
                  value: 100,
                  min: 50,
                  max: 100,
                  step: 1
              });
              break;
          case 2: // Gradient between 2 paths
              props.push({
                  type: 'range',
                  id: "Resolution",
                  value: 100,
                  min: 1,
                  max: 1000,
                  step: 1
              });
              props.push({
                  type: 'boolean',
                  id: "Fix Path",
                  value: false
              });
              props.push({
                  type: 'boolean',
                  id: "Remove Original Shapes",
                  value: false
              });
              break;
          default: // 3 or more objects are not supported
              props = [];
      }
      props.push({
          type: 'boolean',
          id: "Show All",
          value: false
      });
      return props;
  };

  var executor = function(args, success, failure) {
      clearTimeout(timeout);
      timeout = setTimeout(function() {
          params = args.params;
          material = args.material;

          if (selectedVolumes.length > 2) {
              failure("Please select 2 or fewer objects");
              return false;
          }

          unitconv = (params["Units"] == "in") ? 1 : 1 / 25.4;

          sDepth = params["Start Depth"] * unitconv;
          eDepth = params["End Depth"] * unitconv;
          Depth = Math.abs(sDepth - eDepth);
          Steps = params.Steps;

          var CurveType = params["Curve Type"];
          var CustomCurve = params["Custom Curve"];
          var CurveParams;
          switch (CurveType) {
              case "linear":
                  CurveParams = [0, 0, 1, 1];
                  break;
              case "ease-in":
                  CurveParams = [0.42, 0, 1, 1];
                  break;
              case "ease-out":
                  CurveParams = [0, 0, 0.58, 1];
                  break;
              case "ease-in-out":
                  CurveParams = [0.42, 0, 0.58, 1];
                  break;
              case "inner-radius":
                  CurveParams = [0.551915024494, 0, 1, 0.551915024494];
                  break;
              case "outer-radius":
                  CurveParams = [0, 0.551915024494, 0.551915024494, 1];
                  break;
              case "custom":
                  CurveParams = CustomCurve.split(',').map(Number);
                  if (CurveParams.length !== 4) {
                      failure("Wrong number of bezier parameters. 4 parameters expected.");
                      return false;
                  }
                  for (i = 0; i < CurveParams.length; i++) {
                      // check if array value is false or NaN
                      if (CurveParams[i] === false || Number.isNaN(CurveParams[i])) {
                          failure("Parameter " + (i + 1).toString() + " is not a number.");
                          return false;
                      }
                  }
                  break;
              default:
          }
          easing = BezierEasing(CurveParams[0], CurveParams[1], CurveParams[2], CurveParams[3]);

          switch (selectedVolumes.length) {
              case 0:
                  executor0(args, success, failure);
                  break;
              case 1:
                  executor1(args, success, failure);
                  break;
              case 2:
                  executor2(args, success, failure);
                  break;
              default:
          }
      }, 500);
  };

  var executor0 = function(args, success, failure) {
      var volumes = [];
      var Direction = params.Direction;
      var Angle = params.Angle;
      if (Direction == "Right") {
          Angle = 0;
      }
      if (Direction == "Up") {
          Angle = 90;
      }
      if (Direction == "Left") {
          Angle = 180;
      }
      if (Direction == "Down") {
          Angle = 270;
      }

      var ShapeType = params["Shape Type"];
      var ShapeHeight = params["Shape Height"] * unitconv;
      var ShapeWidth = params["Shape Width"] * unitconv;
      var GradientLength = params["Gradient Length %"];
      var CenterPoint = params["Center Point"];
      var Center = CenterPoint.split(",")
      if (Center.length != 2) {
          Center[0] = 0;
          Center[1] = 0;
      }
      Center[0] = parseFloat(Center[0]);
      Center[0] = isNaN(Center[0]) ? 0 : Center[0];
      Center[1] = parseFloat(Center[1]);
      Center[1] = isNaN(Center[1]) ? 0 : Center[1];

      var ShapeCenter = {
          x: Center[0] * unitconv,
          y: Center[1] * unitconv
      };
      var VolumeTemplate = {
          shape: {
              type: ShapeType,
              center: ShapeCenter,
              width: ShapeWidth,
              height: ShapeHeight,
              flipping: {},
              rotation: 0
          },
          cut: {
              depth: sDepth,
              type: 'fill'
          }
      };

      var HeightOffset = (ShapeHeight * GradientLength / 100) / Steps;
      var WidthOffset = (ShapeWidth * GradientLength / 100) / Steps;

      var DirectionOffset = 0;
      GeneratePaperPaths([VolumeTemplate]);
      VolumeTemplate.PaperPath.rotate(-1 * Angle);
      DirectionOffset = (VolumeTemplate.PaperPath.bounds.width * GradientLength / 100) / Steps;
      delete VolumeTemplate.PaperPath;

      for (i = -1; i < Steps; i += 1) {
          var bezier_in = (i + 1) / Steps;
          var bezier_out = easing(bezier_in);

          var tmpWidth = ShapeWidth - WidthOffset * (i + 1);
          var tmpHeight = ShapeHeight - HeightOffset * (i + 1);
          var tmpDepth = sDepth + (eDepth - sDepth) * bezier_out;
          tmpDepth = Math.min(Math.max(0, tmpDepth), material.dimensions.z);

          if (tmpWidth > 0 && tmpHeight > 0) {

              switch (Direction) {
                  case "Inwards":
                      VolumeTemplate.shape.width = tmpWidth;
                      VolumeTemplate.shape.height = tmpHeight;
                      VolumeTemplate.cut.depth = tmpDepth;
                      volumes.push(JSON.parse(JSON.stringify(VolumeTemplate)));
                      break;
                  case "Left":
                  case "Right":
                  case "Up":
                  case "Down":
                  case "Specific Angle":


                      VolumeTemplate.cut.depth = tmpDepth;
                      var nextVol = JSON.parse(JSON.stringify(VolumeTemplate));
                      var vector = vectorchange(nextVol.shape.center.x, nextVol.shape.center.y, Angle, DirectionOffset * (i + 1));
                      nextVol.shape.center.x = vector[0];
                      nextVol.shape.center.y = vector[1];
                      volumes.push(nextVol);

                      break;
              }
          }
      }

      if (Direction != "Inwards") {
          GeneratePaperPaths(volumes);


          var intersectvols = [];
          var intersectvol = volumes.shift();
          volumes.forEach(function(vol) {
              var intersect = intersectvol.PaperPath.intersect(vol.PaperPath).clone();
              if (intersect.pathData != "") {
                  var volclone = JSON.parse(JSON.stringify(vol));
                  volclone.PaperPath = intersect;
                  volclone.id = null;
                  intersectvols.push(volclone);
              }
          });
          volumes = volumes.unshift(intersectvol);

          PaperToEasel(intersectvols);
          intersectvols.forEach(function(vol) {
              delete vol.PaperPath;
          });

          volumes = intersectvols;
      }

      if (volumes.length === 0) {
          failure("Could not generate gradient");
          return false;
      }

      if (params["Show All"]) {
          args.volumes.reverse()
          args.volumes.forEach(function(vol) {
              volumes.unshift(vol);
          });
          //volumes.push(...args.volumes);
          //volumes.unshift(...args.volumes);
      }

      success(volumes);
  };

  var executor1 = function(args, success, failure) {
      var volumes = [];
      var Direction = params.Direction;
      var Angle = params.Angle;
      var NormalAngle = 0;
      if (Direction == "Right") {
          Angle = 0;
      }
      if (Direction == "Up") {
          Angle = 90;
      }
      if (Direction == "Left") {
          Angle = 180;
      }
      if (Direction == "Down") {
          Angle = 270;
      }

      var ShapeType = params["Shape Type"];
      var GradientLength = params["Gradient Length %"];
      var TargetVolume = JSON.parse(JSON.stringify(selectedVolumes[0]));

      if (TargetVolume.shape.type == "line" || (TargetVolume.shape.type == "path" && TargetVolume.shape.points.length == 1 && TargetVolume.shape.points[0].length == 2)) {
          ConvertVolumes([TargetVolume]);

          if (TargetVolume.shape.type == "path" && TargetVolume.shape.points.length == 1 && TargetVolume.shape.points[0].length == 2) {
              TargetVolume.shape.point1 = TargetVolume.shape.points[0][0];
              TargetVolume.shape.point2 = TargetVolume.shape.points[0][1];
              /*
              GeneratePaperPaths([TargetVolume]);
              console.log(TargetVolume);
              console.log(TargetVolume.PaperPath.className);
              console.log(TargetVolume.PaperPath.segments)
              PaperToEasel([TargetVolume]);
              delete TargetVolume.PaperPath;
              TargetVolume.shape.point1 = TargetVolume.shape.points[0][0];
              TargetVolume.shape.point2 = TargetVolume.shape.points[0][1];*/
          }

          var pt1 = {
              x: TargetVolume.shape.point1.x,
              y: TargetVolume.shape.point1.y
          };
          var pt2 = {
              x: TargetVolume.shape.point2.x,
              y: TargetVolume.shape.point2.y
          };
          var ShapeHeight = params["Shape Height"] * unitconv;
          var ReverseHeight = params["Reverse Height"];
          if (ReverseHeight) {
              ShapeHeight *= -1;
          }
          var ShapeWidth = Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
          var Slope = -1 * (pt2.x - pt1.x) / (pt2.y - pt1.y);
          var t = ShapeHeight / Math.sqrt(1 + Math.pow(Slope, 2));
          var pt3 = {
              x: pt2.x + t,
              y: pt2.y + Slope * t
          };
          var pt4 = {
              x: pt1.x + t,
              y: pt1.y + Slope * t
          };
          var pts = [
              [pt1, pt2, pt3, pt4, pt1]
          ];

          var newvol = EASEL.pathUtils.fromPointArrays(pts);
          TargetVolume.shape = newvol.shape;

          NormalAngle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x) * 180 / Math.PI + 90;
          //if(NormalAngle < 0) {NormalAngle +=180;}
          //if(NormalAngle > 360) {NormalAngle -=180;}


          if (Direction == "Normal") {
              Angle = NormalAngle;
          }
          if (Direction == "Reverse Normal") {
              Angle = NormalAngle - 180;
          }
      }

      // Find Max offset before no volumes exist
      // Only do once for performance.
      if (maxoffset === Infinity) {
          maxoffset = FindMaxOffset(JSON.parse(JSON.stringify(TargetVolume)), 0, Math.min(TargetVolume.shape.width, TargetVolume.shape.height), 0);
      }

      var DirectionOffset = 0;
      GeneratePaperPaths([TargetVolume]);
      TargetVolume.PaperPath.rotate(-1 * Angle);
      DirectionOffset = (TargetVolume.PaperPath.bounds.width * GradientLength / 100) / Steps;

      var VolumeTemplate = {
          shape: {
              type: "rectangle",
              center: TargetVolume.shape.center,
              width: TargetVolume.PaperPath.bounds.width,
              height: TargetVolume.PaperPath.bounds.height * 1.5,
              flipping: {},
              rotation: Angle * Math.PI / 180
          },
          cut: {
              depth: 0,
              type: 'fill'
          }
      };

      delete TargetVolume.PaperPath;

      var StepOffset = (Math.round(maxoffset * 1000) / 1000 * GradientLength / 100) / Steps;
      var cutObj = {
          depth: sDepth,
          type: 'fill',
          outlineStyle: 'on-path',
          tabPreference: false
      };



      TargetVolume.cut = JSON.parse(JSON.stringify(cutObj));
      volumes.push(TargetVolume);
      if (ShapeType != "self") {
          VolumeTemplate.cut = JSON.parse(JSON.stringify(cutObj));
          volumes.push(VolumeTemplate);
      }

      for (i = 1; i <= Steps; i++) {
          var bezier_in = i / Steps;
          var bezier_out = easing(bezier_in);

          var stepDepth = sDepth + (eDepth - sDepth) * bezier_out;
          var stepVol;

          switch (Direction) {
              case "Inwards":
                  stepVol = EASEL.volumeHelper.expand([volumes[0]], -1 * StepOffset * i, ClipperLib.JoinType.jtMiter, 5);
                  if (stepVol != null) {
                      stepVol.cut = JSON.parse(JSON.stringify(cutObj));
                      stepVol.cut.depth = stepDepth;
                      volumes.push(stepVol);
                  }
                  break;
              case "Left":
              case "Right":
              case "Up":
              case "Down":
              case "Specific Angle":
              case "Normal":
              case "Reverse Normal":
                  if (ShapeType == "self") {
                      stepVol = JSON.parse(JSON.stringify(volumes[0]));
                  } else {
                      stepVol = JSON.parse(JSON.stringify(VolumeTemplate));
                  }
                  var vector = vectorchange(stepVol.shape.center.x, stepVol.shape.center.y, Angle, DirectionOffset * i);
                  stepVol.shape.center.x = vector[0];
                  stepVol.shape.center.y = vector[1];
                  stepVol.cut = JSON.parse(JSON.stringify(cutObj));
                  stepVol.cut.depth = stepDepth;
                  volumes.push(stepVol);
                  break;
          }
      }

      if (Direction != "Inwards") {
          GeneratePaperPaths(volumes);

          var intersectvols = [];
          var intersectvol = volumes.shift();
          volumes.forEach(function(vol) {
              var intersect = intersectvol.PaperPath.intersect(vol.PaperPath).clone();
              if (intersect.pathData != "") {
                  var volclone = JSON.parse(JSON.stringify(vol));
                  volclone.PaperPath = intersect;
                  volclone.id = null;
                  intersectvols.push(volclone);
              }
          });
          intersectvols.unshift(intersectvol);

          PaperToEasel(intersectvols);
          intersectvols.forEach(function(vol) {
              delete vol.PaperPath;
          });

          volumes = intersectvols;
      }

      if (params["Show All"]) {
          args.volumes.reverse()
          args.volumes.forEach(function(vol) {
              volumes.unshift(vol);
          });
          //volumes.push(...args.volumes);
          //volumes.unshift(...args.volumes);
      }

      success(volumes);
  };

  var executor2 = function(args, success, failure) {
      var Resolution = params["Resolution"];
      var Fix = params["Fix Path"];
      var Reverse = (sDepth > eDepth);
      var RemoveOriginal = params["Remove Original Shapes"];

      var volumes = [];
      //selectedVolumes[0].cut.depth = 0;
      //selectedVolumes[1].cut.depth = 0;
      volumes.push(JSON.parse(JSON.stringify(selectedVolumes[0])));
      volumes.push(JSON.parse(JSON.stringify(selectedVolumes[1])));

      GeneratePaperPaths(volumes);

      if (Fix) {
          volumes[0].PaperPath.reverse();
      }
      var path1 = volumes[0].PaperPath;
      var path2 = volumes[1].PaperPath;
      if (Reverse) {
          path1 = volumes[1].PaperPath;
          path2 = volumes[0].PaperPath;
      }

      var {
          targetPath,
          topPath,
          bottomPath
      } = renderPaperPath(path1, path2, Steps, Resolution);
      targetPath.children.reverse();

      var cutobj = {
          depth: 0,
          type: "fill",
          outlineStyle: "on-path"
      };
      var topDepth = Math.min(sDepth, eDepth);
      var botDepth = Math.max(sDepth, eDepth);

      //var sDepth = params["Start Depth"];
      //var eDepth = params["End Depth"];
      //var DepthDelta = Math.abs(eDepth - sDepth);

      var itr = 0;
      targetPath.children.forEach(function(child) {
          //child.fillColor = 'rgb(' + (itr).toString() + ',' + (itr).toString() + ',' + (itr).toString() + ')';
          var bezier_in = itr / targetPath.children.length;
          var bezier_out = easing(bezier_in);
          var stepDepth = botDepth + (topDepth - botDepth) * bezier_out;

          //cutobj.depth = Math.min(botDepth + itr * (topDepth - botDepth) / Steps, material.dimensions.z);
          cutobj.depth = Math.max(Math.min(stepDepth, botDepth), topDepth);
          volumes.push({
              PaperPath: child,
              cut: JSON.parse(JSON.stringify(cutobj))
          });
          itr++;
      });

      PaperToEasel(volumes);
      volumes.forEach(function(volume) {
          delete volume.PaperPath;
      });

      if (RemoveOriginal) {
          delete volumes[0].shape;
          delete volumes[0].cut;
          delete volumes[1].shape;
          delete volumes[1].cut;
      }


      if (params["Show All"]) {
          args.volumes.reverse()
          args.volumes.forEach(function(vol) {
              volumes.unshift(vol);
          });
          //volumes.push(...args.volumes);
          //volumes.unshift(...args.volumes);
      }

      success(volumes);
  };

  function renderPaperPath(topPath, bottomPath, steps, resolution) {
      var GradientPath = '';

      for (var i = 0; i < steps; i++) {
          var subpath = 'm 0 0 h ' + ('1 ').repeat(resolution) + ' v ' + ((i + 1) / steps).toString() + ' h ' + ('-1 ').repeat(resolution) + ' v -' + ((i + 1) / steps).toString() + ' z ';
          GradientPath += subpath;
      }

      const pathWarp = new PathWarp(paper);
      const targetPath = new paper.CompoundPath({
          pathData: GradientPath,
          fillColor: 'lightblue',
          strokeColor: '#ff0000'
      });
      targetPath.warpBetween(topPath, bottomPath);
      return {
          targetPath,
          topPath,
          bottomPath
      };
  }

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

  function vectorchange(xCoord, yCoord, angle, length) {
      length = typeof length !== 'undefined' ? length : 10;
      angle = angle * Math.PI / 180; // if you're using degrees instead of radians
      return [length * Math.cos(angle) + xCoord, length * Math.sin(angle) + yCoord];
  }

  function FindMaxOffset(volin, minsize, maxsize, level) {
      if (level > 25) {
          return ((maxsize + minsize) / 2);
      }
      var offvol = EASEL.volumeHelper.expand([volin], (-1 * (maxsize + minsize) / 2), ClipperLib.JoinType.jtMiter, 5);
      if (offvol === null) {
          //console.log('Null ' + level);
          maxsize = (maxsize + minsize) / 2;
          return FindMaxOffset(volin, minsize, maxsize, level + 1);
      } else {
          //console.log('Not Null ' + level);
          minsize = (maxsize + minsize) / 2;
          return FindMaxOffset(volin, minsize, maxsize, level + 1);
      }
  }