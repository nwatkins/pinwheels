var rgraph;
var skillLabels = {};

function init() {
    var data = buildTree(ROOT);
    
    function getLabelPosition(canvas, x, y) {
        var pos = { x: x, y: y }, 
            ox = canvas.translateOffsetX,
            oy = canvas.translateOffsetY,
            sx = canvas.scaleOffsetX,
            sy = canvas.scaleOffsetY,
            radius = canvas.getSize();
            labelPos = {
                left: Math.round(pos.x * sx + ox + radius.width / 2),
                top: Math.round(pos.y * sy + oy + radius.height / 2)
            };
        return labelPos;
    }
    
    $jit.RGraph.Plot.NodeTypes.implement({ 
        'stroke-circle': {  
            render: function(node, canvas) { 
                if (node.id.indexOf("dummy") !== -1) { return; }
             
                var pos = node.pos.getc(true), 
                    radius = node.getData("dim"),
                    strokeColor = node.getData("strokeStyle"),
                    lineWidth = node.getData("lineWidth"),
                    ctx = rgraph.canvas.getCtx();
                ctx.beginPath();
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = strokeColor;
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            },
            
            // optional  
            contains: function(node, pos) {  
                var npos = node.pos.getc(true), 
                dim = node.getData('dim');
                return this.nodeHelper.circle.contains(npos, pos, dim); 
            }
        }  
    });
    
    $jit.RGraph.Plot.EdgeTypes.implement({ 
        'skill-line': {  
            render: function(adj, canvas) {
                var from = adj.nodeFrom.pos.getc(true),
                to = adj.nodeTo.pos.getc(true);
                
                if (adj.nodeFrom._depth == 0 || adj.nodeTo._depth == 0) {
                    var connection, root;
                    if (adj.nodeFrom._depth == 0) {
                        connection = adj.nodeTo;
                        root = adj.nodeFrom;
                    } else {
                        connection = adj.nodeFrom;
                        root = adj.nodeTo;
                    }
                        
                    var midX = (from.x + to.x) / 2;
                    var midY = (from.y + to.y) / 2
                    
                    var skill;
                    // if it's connecting to a dummy (skill) node, only draw it halfway
                    if (connection.id.indexOf("dummy") === -1) {
                        this.edgeHelper.line.render(root.pos.getc(true), connection.pos.getc(true), canvas);
                        skill = skillLabels[connection.id];
                    } else {
                        this.edgeHelper.line.render(root.pos.getc(true), {x: midX, y: midY}, canvas);
                        if (skillLabels[connection.id]) {
                            skill = skillLabels[connection.id];
                        } else {
                            skill = skillLabels.unconnected.pop();
                            skillLabels[connection.id] = skill;
                        }
                    }
                    
                    // place the appropriate label near the skill node
                    if (skill) {
                        var pos = getLabelPosition(canvas, midX, midY);
                        var left = pos.left - (parseInt(skill.css("width")) / 2);
                        position = $('#pinwheels').position();
                        skill.css({
                            top: pos.top,
                            left: left + position.left
                        });
                    }
                } else {
                    if (adj.nodeFrom.id.indexOf("dummy") === -1 && adj.nodeTo.id.indexOf("dummy") === -1) {
                        this.edgeHelper.line.render(from, to, canvas);
                    }
                }
            },
            
            contains: function(adj, pos) {
                var from = adj.nodeFrom.pos.getc(true),
                    to = adj.nodeTo.pos.getc(true);
                return this.edgeHelper.line.contains(from, to, pos, this.edge.epsilon);
            }
        }  
    }); 
    
    var levelDistance = 175;
    rgraph = new $jit.RGraph({
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
                if (node) {
                    if (node.id.indexOf("dummy") === -1)
                        selectNode(node);
                }
            },
            onDragEnd: function(node) {
                if (node.id.indexOf("dummy") === -1) {
                    selectNode(node);
                }
            }
        },
        
        Edge: {
            type: "skill-line",
            color: '#666',  
            lineWidth: 1.5  
        },
        
        Label: {
            type: "HTML"
        },
        
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
            domElement.style.fontWeight = "bold";
            
            var link = document.createElement("a");
            if (node.id.indexOf("dummy") !== -1)
                $(domElement).hide();
            else {
                link.href = '#' + node.name;
                link.onselectstart = "javascript: return false;";
                link.appendChild(document.createTextNode(node.name));
                $(link).mouseover(function() {
                    if (currentNode != node) {
                        var paths = shortestPath(currentNode, node);
                        //debug.log(paths);
                        for (var i = 0; i < paths.length; ++i) {
                            var path = paths[i];
                            for (var j = 1; j < path.length; ++j) {
                                var nodeA = path[j - 1];
                                var nodeB = path[j];
                            }
                        }
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
    
    if (data) {
        // intiialize the graph using JSON-encoded data
        rgraph.loadJSON(data);
        rgraph.compute('end');
        setCurrentNode(rgraph.canvas.viz.graph.getNode(window.ROOT));
        rgraph.refresh();
        $("pinwheels").focus();
        
        // fire up the history detection functionality
        setInterval(checkNavigation, 200);
    } else {
        alert("The tree data is bad. Aborting.");
    }
}
