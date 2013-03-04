function formatName(str) {
    var clean = str.replace(/[^a-zA-Z0-9\/_|+ -]/g, "");
    clean = clean.replace(/[^a-zA-Z0-9]/g, "_");
    return clean.toLowerCase();
}

function jumpToPinwheel(pinwheel) {
    if (pinwheel) {
        selectNode(rgraph.canvas.viz.graph.getNode(pinwheel));
    }
}

var pinwheelsUsed = [];
var iterations = 0;
var dummyCount = 0;
function buildTree(pinwheel, depth) {
    if (!PINWHEELS[pinwheel]) {
        alert("There is no pinwheel index \""+pinwheel+"\".")
        return false;
    }
    iterations++;
    depth = depth || 1;
    var pinwheelData = PINWHEELS[pinwheel];
    var name = pinwheelData.name;
    var node = {
        id: pinwheel,
        name: name,
        children: new Array()
    }
    
    // if either max depth reached, or the pinwheel has already been mapped, return
    if (depth > MAX_DEPTH || pinwheelsUsed.indexOf(pinwheel) !== -1) {
        return node;
    } else {
        pinwheelsUsed.push(pinwheel);
        // loop through skills, create nodes from their connections
        
        var skills = pinwheelData.skills;        
        // get the child pinwheels of this one
        var childPinwheels = [];
        for (var i = 0; i < skills.length; ++i) {
            var skill = skills[i];
            var skillData = window.SKILLS[skill];
            var pinwheels = skillData.pinwheels;
            
            // grab the pinwheel unid that isn't this one
            if (pinwheels.length > 1) {
                for (var j = 0; j < pinwheels.length; ++j) {
                    if (pinwheels[j] != pinwheel) {
                        childPinwheels.push(pinwheels[j]);
                        break;
                    }
                }
            } else {
                childPinwheels.push("dummy");
            }
        }
        
        //debug.log("child pinwhees: "+childPinwheels.join(", "));
        for (var i = 0; i < childPinwheels.length; ++i) {
            var childPinwheel = childPinwheels[i];
            
            var child;
            if (childPinwheel == "dummy") {
                child = {
                    id: "dummy" + (dummyCount++),
                    name: "dummy",
                    children: []
                }
            } else {
                //debug.log("entering child pinwheel: "+childPinwheel);
                child = buildTree(childPinwheel, depth + 1);
            }
            if (child)
                node.children.push(child);
            else {
                return false;
            }
        }
    }
    return node;
}

function getAnchor() {
    return window.location.hash.replace("#", "");
}

var navigationQueue = new Array();
function checkNavigation() {
    var currentAnchor = getAnchor();
    // if states mismatch, some navigation change took place
    if (lastAnchor != currentAnchor) {
        lastAnchor = currentAnchor;
        var pinwheel = formatName(getAnchor());
        console.log(pinwheel);
        if (!rgraph.busy) {
            rgraph.onClick(pinwheel, rgraph.config.Fx);
            var node = rgraph.canvas.viz.graph.getNode(pinwheel);
            setCurrentNode(node);
        }else
            navigationQueue[0] = pinwheel;
    }
    
    if (navigationQueue.length > 0 && !rgraph.busy) {
        rgraph.onClick(navigationQueue.shift(), rgraph.config.Fx);
        var node = rgraph.canvas.viz.graph.getNode(pinwheel);
        setCurrentNode(node);
    }
}

var currentNode, skillLabels, DIALOGS = {};

function selectNode(node, callback) {
    if (node === currentNode) {
        return false;
    }

    setCurrentNode(node, callback);
    rgraph.onClick(node.id, rgraph.config.Fx);
    window.location.href = '#' + node.name;
    lastAnchor = getAnchor();
}

function openSkillDialog(skill) {
    if (DIALOGS[skill]) {
        DIALOGS[skill].dialog("open");
    } else {
        // get the data through AJAX
        var unid = SKILLS[skill].unid;
        $.ajax({
            type: "GET",
            url: "scripts/getSkillInfo.php?unid="+unid,
            dataType: "json",
            success: function(data) {
                //debug.log(data);
                var height = 250;
                var dialog = $("<div>")
                .attr("title", data.name+" ("+data.attribute+")")
                .dialog({
                    height: height,
                    width: 400,
                    show: "drop"
                });
                
                dialog.data("height", height);
                dialog.bind("dialogresizestop", (function(event, ui) {
                    dialog.data("height", ui.size.height);
                }));
                
                var pinwheelLinks = $("<p>").html("<strong>Pinwheels:</strong> ");
                for (var i = 0; i < data.pinwheels.length; ++i) {
                    var pinwheel = data.pinwheels[i];
                    var callBack = (function() {
                        var p = pinwheel;
                        return function() {
                            selectNode(rgraph.canvas.viz.graph.getNode(formatName(p)));
                        };
                    })();
                    var pinwheelLink = $("<a>")
                        .attr("href", "javascript:void(0);")
                        .addClass("pinwheel_link")
                        .text(pinwheel)
                        .click(callBack);
                    pinwheelLinks.append(pinwheelLink);
                    if (i < data.pinwheels.length - 1) pinwheelLink.after(", ");
                }
                
                dialog.append(pinwheelLinks);
                if (data.description) dialog.append("<h3>Description</h3><p>"+data.description+"</p>");
                if (data.modifier) dialog.append("<h3>Modifier</h3><p>"+data.modifier+"</p>");
                if (data.variant) dialog.append("<h3>Variant</h3><p>"+data.variant+"</p>");
                if (data.everyman) dialog.append("<h3>Everyman</h3><p>"+data.everyman+"</p>");
                if (data.related) dialog.append("<h3>Related</h3><p>"+data.related+"</p>");
                
                // attach double click listener to the title bar
                dialog.siblings(".ui-dialog-titlebar").dblclick(function() {
                    minimizeDialog(dialog);
                });
                
                DIALOGS[skill] = dialog;
            }
        });
    }
}

function minimizeDialog(dialog) {
    var height = dialog.dialog("option", "height");
    if (height > 1) {
        dialog.siblings(".ui-icon-gripsmall-diagonal-se").hide();
        dialog.dialog("option", "height", 1);
    } else {
        dialog.siblings(".ui-icon-gripsmall-diagonal-se").show();
        dialog.dialog("option", "height", dialog.data("height"));
    }
}

function createSkillLabels(skills) {
    $(".skill").remove();
    skillLabels = {};
    skillLabels.unconnected = [];
    skillLabelsPlotted = 0;
    for (var i = 0; i < skills.length; ++i) {
        var skill = SKILLS[skills[i]];
        var label = $("<div>")
            .addClass("skill")
            .addClass('btn')
            .append("<a href=\"javascript:void(0);\" onselectstart=\"javascript: return false;\">"+skill.name+"</a>")
            .mouseover(function() {
                $(this).css("zIndex", 999);
            }).mouseout(function() {
                $(this).css("zIndex", "auto");
            }).click(function() {
                var skill = $(this).data("skill");
                if (skill)
                    openSkillDialog(skill);
            }).data("skill", skills[i]);
        $("#pinwheels").append(label);
        
        // skill only has one connection
        if (skill.pinwheels.length < 2) {
            skillLabels.unconnected.push(label);
            label.css("top", (25 * skillLabels.unconnected.length) + 40);
        } else {
            var connection;
            for (var j = 0; j < skill.pinwheels.length; ++j) {
                if (skill.pinwheels[j] != currentNode.id) {
                    connection = skill.pinwheels[j];
                }
            }
            skillLabels[connection] = label;
        }
    }
}

function deleteSkillLabels() {
    // get rid of the unconnected labels
    for (var i = 0; i < skillLabels.unconnected; ++i) {
        var label = skillLabels.unconnected[i];
        if (label && label.parentNode) {
            label.parentNode.removeChild(label);
        }
    }
    // get rid of the rest
    for (var i in skillLabels) {
        if (i != "unconnected") {
            var label = skillLabels[i];
            //debug.log(label);
            if (label && label.parentNode) {
                label.parentNode.removeChild(label);
            }
        }
    }
    skillLabels = {};
}

// function called when a new node is set as root
function setCurrentNode(node, callback) {
    currentNode = node;
    
    var pinwheel = PINWHEELS[node.id];
    
    // delete/create skill labels
    createSkillLabels(pinwheel.skills);
    
    // change the pinwheel title
    $("#pinwheelname").html("<h1>"+node.name+"<h2>");
    
    // load the skill information
    $("#loadspinner").show();
    var infoWrap = $("#infowrap");

    //$("#perkcontent").accordion("destroy");
    // infoWrap.hide();
    // $.ajax({
    //     type: "POST",
    //     url: "scripts/getPinwheelInfo.php?unid="+pinwheel.unid,
    //     dataType: "json",
    //     success: function(data) {
    //         $("#loadspinner").hide();
    //         //debug.log(data);
    //         infoWrap.show();
            
    //         $("#perkcontent").html(data.perks);
    //         $("#perkcontent").accordion({
    //             collapsible: true,
    //             active: false,
    //             autoHeight: false
    //         });
            
    //         if (typeof callback === "function")
    //             callback();
    //     }
    // });
}

function shortestPath(nodeFrom, nodeTo) {
    var directions = new Array();
    var visited = new Array();
    var prev = new Array();
    var queue = new Array();
    var current = nodeFrom;
    var foundDepth;
    var depth = 0;
    queue.push({node: current, depth: depth});
    visited.push(current);
    
    while (queue.length > 0) {
        var currentData = queue.shift();
        current = currentData.node;
        depth = currentData.depth;
        
        if (current == nodeTo) {
            foundDepth = depth;
        } else if (!foundDepth || (foundDepth && (depth + 1) <= foundDepth)) {
            current.eachSubnode(function (node) {
                if (visited.indexOf(node) === -1) {
                    queue.push({node: node, depth: depth + 1});
                    if (node != nodeTo) {
                        visited.push(node);
                    }
                    prev.push({node: node, parent: current});
                }
            });
        }
    }
    
    //debug.log(prev);
    // now find the paths back to the root
    var paths = new Array();
    var results = indexOfNode(prev, nodeTo, true);
    for (i = 0; i < results.length; ++i) {
        var index = results[i];
        var directions = new Array();
        directions.push(prev[index].node);
        
        var count = 0;
        while (count < 100) {
            try {
                parent = prev[index].parent
            } catch (err) {
                break;
            }
            
            directions.push(parent);
            index = indexOfNode(prev, parent);
            count++;
        }
        
        directions.reverse();
        paths.push(directions);
    }
    
    var paths_html = "";
    for (var i = 0; i < paths.length; ++i) {
        var nodes = paths[i];
        var path = [];
        for (var j = 0; j < nodes.length; ++j)
            path.push(nodes[j].name);
        paths_html += "<p>"+path.join(" > ")+"</p>";
    }
    $("#shortest_paths").html(paths_html);
    return paths;
}

function indexOfNode(a, node, findAll) {
    findAll = findAll || false;
    var indices = new Array();
    for (var i = 0; i < a.length; ++i) {
        var obj = a[i];
        if (node === obj.node) {
            if (findAll)
                indices.push(i);
            else
                return i;
        }
    }
    if (indices.length > 0) return indices;
    else return -1;
}

$(function() {
    // Make sure inner container's height matches the viewport's
    $('#main').height($(document).height());
    $(window).resize(function() {
        var bodyHeight = $(window).height();
        $('#main').height(bodyHeight);
        canvasSize = rgraph.canvas.getSize();
        rgraph.canvas.resize(canvasSize.width, bodyHeight);
        rgraph.refresh();
    });

    window.MAX_DEPTH = 10;
    // get the anchor, use it as the root
    var anchor = getAnchor() || function() {
        for (p in window.PINWHEELS) {
            if (window.PINWHEELS.hasOwnProperty(p)) {
                rootPinwheel = window.PINWHEELS[p]
                window.location = '#' + rootPinwheel.name
                return rootPinwheel.name;
            }
        }
    }();
    window.lastAnchor = anchor;
    window.ROOT = formatName(anchor);

    // set default animation speed
    $.fx.speeds._default = 300;

    init();
    $("body").keyup(function(e) {
        var key = e.keyCode;
        
        // zoom in
        if (!e.ctrlKey && (key == 107 || key == 187)) {
            zoom(1);
        } else if (!e.ctrlKey && (key == 109 || key == 189)) {
            zoom(-1);
        }
    });
    
    function zoom(delta) {
        var val = rgraph.config.Navigation.zooming * 3 / 1000, ans = 1 + delta * val;
        rgraph.canvas.scale(ans, ans);
    }
});
