// Returns the window's hash value, stripping out the pound sign
window.getAnchor = function() {
    return window.location.hash.replace('#', '');
}

// init
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

     // Makes an underscored, lowercase form from the string
    var underscore = function(str) {
        var clean = str.replace(/[^a-zA-Z0-9\/_|+ -]/g, "");
        clean = clean.replace(/[^a-zA-Z0-9]/g, "_");
        return clean.toLowerCase();
    }

    // Recursively builds adjacency list from matching pinwheels/skills in pinwheel and skill data.
    // Returns root node
    var pinwheelsUsed = [],
        iterations = 0,
        dummyCount = 0;
    var buildTree = function(pinwheel, depth) {
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
        if (depth > 10 || pinwheelsUsed.indexOf(pinwheel) !== -1) {
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
            
            // console.log("child pinwhees: "+childPinwheels.join(", "));
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
                    // console.log("entering child pinwheel: "+childPinwheel);
                    child = buildTree(childPinwheel, depth + 1);
                }
                if (child) {
                    node.children.push(child);
                } else {
                    return false;
                }
            }
        }
        return node;
    };


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


    var zoom = function(delta) {
        var val = rgraph.config.Navigation.zooming * 3 / 1000, ans = 1 + delta * val;
        rgraph.canvas.scale(ans, ans);
    }
    // Listen for '+' or '-' key presses to change zoom level
    $("body").keyup(function(e) {
        var key = e.keyCode;
        
        if (!e.ctrlKey && (key == 107 || key == 187)) {
            zoom(1); // zoom in
        } else if (!e.ctrlKey && (key == 109 || key == 189)) {
            zoom(-1); // zoom out
        }
    });


    // Initialize the graph
    var levelDistance = 175;
    window.rgraph = new $jit.RGraph({
        // Where to append the visualization
        injectInto: 'pinwheels', 
        levelDistance: levelDistance,
         
        // Create a background canvas that plots concentric circles
        background: {
            levelDistance: levelDistance,
            numberOfCircles: 10,
            CanvasStyles: {  
                strokeStyle: '#863233'
            } 
        },
        
        Margin: {  
            top: 0,  
            left: 0,  
            right: 0,  
            bottom: 0  
        },
        
        // Add navigation capabilities: zooming by scrolling and panning
        Navigation: {  
            enable: true,  
            panning: true,  
            zooming: 100  
        },
        
        //Set Node and Edge styles.  
        Node: {
            overridable: true,
            type: "stroke-circle",
            color: "#9A9898",
            dim: 30,
            strokeStyle: '#999',
            lineWidth: 2
        },
        
        Events: {
            enable: true,
            onClick: function(node) {
                if (node && window.rgraph.currentNode != node) {
                    if (node.id.indexOf("dummy") === -1) {
                        window.rgraph.selectNode(node);
                    }
                }
            },
            onDragEnd: function(node) {
                if (node.id.indexOf("dummy") === -1) {
                    window.rgraph.selectNode(node);
                }
            }
        },
        
        Edge: {
            type: "skill-line",
            color: '#666',  
            lineWidth: 1.5  
        },
        
        Label: { type: "HTML" },
        
        Fx: {
            hideLabels: false,
            fps: 30,  
            duration: 1000,  
            transition: $jit.Trans.Cubic.easeOut,  
            clearCanvas: true
        },
          
        onBeforePlotNode: function(node) {
            node.setData("lineWidth", 4);
            node.Node.CanvasStyles = { "fillStyle": "#CACACA" };
            if (node._depth == 0) {
                node.setData("strokeStyle", "#712627");
            } else {
                node.setData("strokeStyle", "#C3C3C3");
            }
        },
        
        onBeforePlotLine: function(edge) {
            var nodeFrom = edge.nodeFrom;
            var nodeTo = edge.nodeTo;
            var minDepth = Math.min(nodeFrom._depth, nodeTo._depth);
            
            var alpha;
            if (minDepth == 0) {
                alpha = 1;
            } else if (minDepth < 2) {
                alpha = 0.5;
            } else if (minDepth == 2) {
                alpha = 0.3;
            } else if (minDepth > 2) {
                alpha = 0.1;
            }
            edge.Edge.alpha = alpha;
        },
        
        // Add the name of the node in the correponding label  
        // and a click handler to move the graph.  
        // This method is called once, on label creation.
        onCreateLabel: function(domElement, node) {
            var link = document.createElement("a");
            if (node.id.indexOf("dummy") !== -1) {
                $(domElement).hide();
            } else {
                link.href = '#' + node.name;
                link.onselectstart = "javascript: return false;";
                link.appendChild(document.createTextNode(node.name));
                $(link).mouseover(function(e) {
                    if (window.rgraph.currentNode != node) {
                        var paths = window.rgraph.currentNode.shortestPathTo(node);
                        console.log(paths);
                        var paths_html = "<h4>Shortest paths:</h4>";
                        for (var i = 0; i < paths.length; ++i) {
                            var nodes = paths[i];
                            var path = [];
                            for (var j = 0; j < nodes.length; ++j)
                                path.push(nodes[j].name);
                            paths_html += "<p>"+path.join(" > ")+"</p>";
                        }
                        console.log(paths_html);
                        $("#shortest-paths").html(paths_html);
                    }
                });
            }
            domElement.appendChild(link);
        },  
        
        // Change some label dom properties.  
        // This method is called each time a label is plotted.  
        onPlaceLabel: function(domElement, node){
            var link = $(domElement).children("a")[0];
            var style = domElement.style
            
            if (node._depth <= 1) {
                link.className = "depth0";
            } else if(node._depth == 2) {
                link.className = "depth1";
            } else {
                link.className = "depth2";
            }
            
            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + "px";
            style.marginTop = "-7px";
        }
    });

    
    // Load the data tree for the graph, setting the root as the initial node
    var rootId = underscore(anchor);
    var data = buildTree(rootId);
    if (data) {
        // intiialize the graph using JSON-encoded data
        rgraph.loadJSON(data);
        rgraph.compute('end');
        rgraph.setCurrentNode(rgraph.canvas.viz.graph.getNode(rootId));
        rgraph.refresh();
        $("pinwheels").focus();
        
        // Fire up the history detection functionality
        var navigationQueue = new Array();
        setInterval(function() {
            var currentAnchor = window.getAnchor();
            // if states mismatch, some navigation change took place
            if (lastAnchor != currentAnchor) {
                lastAnchor = currentAnchor;
                var pinwheel = underscore(window.getAnchor());
                if (!rgraph.busy) {
                    rgraph.onClick(pinwheel, rgraph.config.Fx);
                    window.rgraph.setCurrentNode(rgraph.canvas.viz.graph.getNode(pinwheel));
                } else {
                    navigationQueue[0] = pinwheel;
                }
            }
            
            if (navigationQueue.length > 0 && !rgraph.busy) {
                rgraph.onClick(navigationQueue.shift(), rgraph.config.Fx);
                window.rgraph.setCurrentNode(rgraph.canvas.viz.graph.getNode(pinwheel));
            }
        }, 200);
    } else {
        alert("The tree data is bad. Aborting.");
    }
});
