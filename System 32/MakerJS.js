var makerjs = require('makerjs');

var makerParams = [
  {section: "Size",title: "Height",type: "range",value: 960,min: 32,max: 3840,step: 1},
  {section: "Size",title: "Width",type: "range",value: 320,min: 32,max: 960,step: 1},
  {section: "Size",title: "Depth",type: "range",value: 320,min: 32,max: 960,step: 1},
  {section: "Material Thickness",title: "Top and Bottom",type: "range",value: 19,min: 6,max: 30,step: 0.01},
  {section: "Material Thickness",title: "Sides",type: "range",value: 19,min: 6,max: 30,step: 0.01},
  {section: "Material Thickness",title: "Back",type: "range",value: 19,min: 6,max: 30,step: 0.01},
  {section: "Corner Style",title: "Corner Style",type: "select",value: ["Full Top","Full Side"]},
  {section: "Base",title: "Base",type: "bool",value: false},
  {section: "Base",title: "Thickness",type: "range",value: 19,min: 6,max: 24,step: 0.01},
  {section: "Base",title: "Height",type: "range",value: 64,min: 0,max: 960,step: 1},
  {section: "Base",title: "Recess",type: "range",value: 64,min: 0,max: 960,step: 1},
  {section: "Shelf",title: "Full Length Pins",type: "bool",value: true},
  {section: "Shelf",title: "Qty",type: "range",value: 12, min: 2, max: 100},
  {section: "Shelf",title: "Center Height",type: "range",value: 320, min: 0, max: 3840, step: 0.5},
  {section: "Misc",title: "Shelf Hole Distance",type: "range",value: 6,min: 0,max: 20,step: 1},
  {section: "Back Style",title: "Back Style",type: "select",value: ["Groove","Flush"]},
  {section: "Doors",title: "Doors",type: "select",value: ["0","1","2"]},
  {section: "Doors",title: "Hinge Side",type: "select",value: ["Left","Right"]},
  {section: "Doors",title: "Qty",type: "select",value: ["2","3","4","5"]},
  {section: "Doors",title: "Style",type: "select",value: ["Pot", "Concealed", "35mm", "8mm Holes"]},
  {section: "Misc",title: "Joining System",type: "select",value: ["Dowels","Screws", "Connector"]},
  {section: "Misc",title: "Qty Moveable Shelves",type: "range",value: 0,min: 0,max: 10,step: 1},
  {section: "Misc",title: "Qty Fixed Shelves",type: "range",value: 0,min: 0,max: 10,step: 1},
  {section: "Misc",title: "Height",type: "range",value: 0,min: 0,max: 1000,step: 1}
];

function System32(nArgs) {
  var args = {};
  if(typeof EaselEnv == 'undefined') {
    for(var i = 0; i < makerParams.length; i++) {
      args[(makerParams[i].section + '_' + makerParams[i].title).replaceAll(' ','-')] = arguments[i];
    }
  } else {
    args = nArgs;
  }
  
  var spacing = 32;
  var panel_top = new makerjs.models.Rectangle(args['Size_Width']-(args['Corner-Style_Corner-Style']=="Full Side"?args['Material-Thickness_Sides']*2:0), args['Size_Depth']);
  var panel_bot = new makerjs.models.Rectangle(args['Size_Width']-(args['Corner-Style_Corner-Style']=="Full Side" || args['Base_Base']?args['Material-Thickness_Sides']*2:0), args['Size_Depth']);
  var panel_lside = new Panel_Side(args);
  var panel_rside = new Panel_Side(args);
  panel_rside = makerjs.model.mirror(panel_rside, true, false);
  var panel_back = new makerjs.models.Rectangle(args['Size_Width'] - args['Material-Thickness_Sides'], args['Size_Height'] - args['Material-Thickness_Top-and-Bottom']);
  
  SetCenter(panel_top, 0, args['Size_Height']/2 + spacing + args['Size_Depth']/2);
  SetCenter(panel_bot, 0, -args['Size_Height']/2 + -spacing + -args['Size_Depth']/2);
  
  SetCenter(panel_rside, args['Size_Width']/2 + spacing + args['Size_Depth']/2, 0);
  SetCenter(panel_lside, -args['Size_Width']/2 + -spacing + -args['Size_Depth']/2, 0);
  
  var recessOffset = 0;
  if(args['Base_Base']) {
    if(args["Corner-Style_Corner-Style"] == "Full Top") {
      recessOffset = args['Base_Height'] + args['Material-Thickness_Top-and-Bottom'];
    } else {
      recessOffset = args['Base_Height'];
    }
  }
  panel_rside = makerjs.model.moveRelative(panel_rside, [0,-recessOffset/2]);
  panel_lside = makerjs.model.moveRelative(panel_lside, [0,-recessOffset/2]);
  
  SetCenter(panel_back, 0, 0);
  
 var groove_top = new BackPanelGroove(args, 'top', makerjs.measure.modelExtents(panel_top));
 var groove_bot = new BackPanelGroove(args, 'bot', makerjs.measure.modelExtents(panel_bot));
 var groove_right = new BackPanelGroove(args, 'right', makerjs.measure.modelExtents(panel_rside));
 var groove_left = new BackPanelGroove(args, 'left', makerjs.measure.modelExtents(panel_lside));
  
  panel_top.cut = 'outline';
  panel_bot.cut = 'outline';
  panel_lside.models.panel.cut = 'outline';
  panel_rside.models.panel.cut = 'outline';
  panel_back.cut = 'outline';
  
  groove_top.cut = 'fill';
  groove_bot.cut = 'fill';
  groove_right.cut = 'fill';
  groove_left.cut = 'fill';
  
  panel_lside.models.holes1.cut = 'pins';
  panel_lside.models.holes2.cut = 'pins';
  panel_rside.models.holes1.cut = 'pins';
  panel_rside.models.holes2.cut = 'pins';
  
  
  this.models = {
    groove_top: groove_top,
    groove_bot: groove_bot,
    groove_right: groove_right,
    groove_left: groove_left,
    panel_top: panel_top,
    panel_bot: panel_bot,
    panel_lside: panel_lside,
    panel_rside: panel_rside,
    panel_back: panel_back
  };
}

function SetCenter(model, x, y) {
  var bbox = makerjs.measure.modelExtents(model);
  var delta = [x-bbox.center[0],y-bbox.center[1]];
  model = makerjs.model.moveRelative(model, delta);
}

function Panel_Side(args) {
  var holeoffsets = args['Misc_Shelf-Hole-Distance'];
  while((37 + 32*holeoffsets) > (args['Size_Depth'] - args['Material-Thickness_Back']*2 - 32)) {
   holeoffsets--; 
  }
  
  var qty = args['Shelf_Qty'];
  var center = args['Shelf_Center-Height'];
  if(args['Shelf_Full-Length-Pins'] === true) {
    qty = Math.floor(args['Size_Height'] / 32);
    center = args['Size_Height'] / 2;
  }
  // Removed validation and added validation to for loop
  //qty = Math.min(qty, Math.floor(height / 32));
  //center = Math.min(Math.max(center, ((qty+1)*32)/2), height - ((qty+1)*32)/2);
  var delta = center - ((qty -1)*32)/2;
  
  var mainPanel_Depth = args['Size_Depth'];
  var mainPanel_Height = args['Size_Height'];
  var mainPanel_Offset_bot = 0;
  var mainPanel_Offset_top = 0;
  
  if(args['Corner-Style_Corner-Style'] == "Full Top") {
    if(args['Base_Base'] === false) {
      mainPanel_Height = mainPanel_Height - args['Material-Thickness_Top-and-Bottom'] - args['Material-Thickness_Top-and-Bottom'];
      mainPanel_Offset_bot = mainPanel_Offset_bot + args['Material-Thickness_Top-and-Bottom'];
      mainPanel_Offset_top = mainPanel_Offset_top + args['Material-Thickness_Top-and-Bottom'];
    } else {
      mainPanel_Height = mainPanel_Height - args['Material-Thickness_Top-and-Bottom'];
      mainPanel_Offset_bot = mainPanel_Offset_bot + 0;
      mainPanel_Offset_top = mainPanel_Offset_top + args['Material-Thickness_Top-and-Bottom'];
    }
  } else {
    
  }
  
  var holes1 = [];
  var holes2 = [];
  for(var i = 0; i < qty; i++){
    var x1 = 37;
    var x2 = 37 + 32*holeoffsets;
    var y = delta + 32 * i;
    if(y >= (5 + mainPanel_Offset_bot) && y <= (args['Size_Height'] - 5 - mainPanel_Offset_top)) {
      holes1.push([x1,y]); 
      holes2.push([x2,y]); 
    }
  }
    
  var mainPanel = makerjs.model.moveRelative(new makerjs.models.Rectangle(mainPanel_Depth, mainPanel_Height),[0,mainPanel_Offset_bot]);
  
  if(args['Base_Base'] === true) {
   var basePanel = makerjs.model.moveRelative(new makerjs.models.Rectangle(mainPanel_Depth - args['Base_Recess'], args['Base_Height']),[args['Base_Recess'],-args['Base_Height']]);
   mainPanel = makerjs.model.combineUnion(mainPanel, basePanel);
  }
  
  this.models = {
    panel: mainPanel,
    holes1: new makerjs.models.Holes(2.5, holes1),
    holes2: new makerjs.models.Holes(2.5, holes2)
  };
  
}

function BackPanelGroove(args, side, bounds) {
  //{"high":[160,672],"low":[-160,512],"center":[0,592],"width":320,"height":160}
  var gHeight = 0;
  var gWidth = 0;
  var delta = [0,0];
  var gOffset = (args['Back-Style_Back-Style']=='Flush'?0:args['Material-Thickness_Back']);
  
  var overcut = 6;
  
  if(side == 'top') {
    gHeight = args['Material-Thickness_Back'];
    gWidth = bounds.width + overcut*2;
    delta = [bounds.low[0] - overcut,bounds.low[1]+gOffset];
  }
  if(side == 'bot') {
    gHeight = args['Material-Thickness_Back'];
    gWidth = bounds.width + overcut*2;
    delta = [bounds.low[0] - overcut,bounds.high[1]-args['Material-Thickness_Back']-gOffset];
  }
  if(side == 'right') {
    gHeight = bounds.height + overcut*2;
    gWidth = args['Material-Thickness_Back'];
    delta = [bounds.low[0]+gOffset,bounds.low[1] - overcut];
  }
  if(side == 'left') {
    gHeight = bounds.height + overcut*2;
    gWidth = args['Material-Thickness_Back'];
    delta = [bounds.high[0]-args['Material-Thickness_Back']-gOffset,bounds.low[1] - overcut];
  }
  
  
 this.models = {
  groove: makerjs.model.moveRelative(new makerjs.models.Rectangle(gWidth,gHeight),delta)
 };
}


System32.metaParameters = makerParams;
module.exports = System32;
