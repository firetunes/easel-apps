// ==UserScript==
// @name         Select by Depth
// @namespace    http://easel.inventables.com/
// @version      0.1.0
// @description  Interface Extension for Easel
// @author       firetunes
// @match        *://easel.inventables.com/projects/*
// @grant        none
// ==/UserScript==






// IN PROGRESS!!! DO NOT USE UNTIL COMPLETE


var timeout;

function addMenu()
{
    var v = $("*[data-action='select-all']").parent();
    if(v.length >= 1)
    {
        var c = `
EASEL.editorActions.select.apply(null, function() {
    var maxDepth = prompt("Max Depth: ", "");
    var minDepth = prompt("Min Depth: ", "");


    // NEED TO MODIFY BELOW TO MAKE IT FUNCTION. CURRENT CODE IS FROM SELECT by MATCH SIZE

    var d = [];
    var s = EASEL.volumeHelper.getSelectedVolumes();
    if (s.length <= 0) {
        alert("Select shapes to match size");
    } else {
        var i;
        for (i = 0; i < s.length; i++) {
            var selected = s[i];
            var a = EASEL.volumeStore.getVolumes();
            var b;
            var c;
            var e = 0;
            for (c = a.length; e < c; e++) {
                b = a[e];
                if (Math.abs(b.shape.width - selected.shape.width) < 0.001 && Math.abs(b.shape.height - selected.shape.height) < 0.001)
                    d.push(b.id);
            }
        }
    }
    return d;
}())
`;

        v.after("<li><a href=\"#\" onclick='"+c+"'>Select by Depth</a></li>");
    }
    else
        timeout = setTimeout(addMenu, 1000);
}


// Add option to menu
//alert("aading");
addMenu();