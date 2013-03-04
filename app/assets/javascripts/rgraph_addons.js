// set default animation speed
$.fx.speeds._default = 300;

// Add method to RGraph to select a given node
$jit.RGraph.prototype.selectNode = function(node) {
    if (node !== self.currentNode) {
        $("#shortest-paths").html('');
        this.setCurrentNode(node);
        this.onClick(node.id, this.config.Fx);

        // Set window's anchor hash to enable history
        window.location.href = '#' + node.name;
        window.lastAnchor = window.getAnchor();
    }
}

// Add method to RGraph to cache currently selected node
$jit.RGraph.prototype.setCurrentNode = function(node) {
    if (node) {
        this.currentNode = node;

        // delete/create skill labels
        this.createSkillLabels(window.PINWHEELS[node.id].skills);
    }
};

$jit.RGraph.prototype.createSkillLabels = function(skills) {
    $(".skill").remove();
    this.skillLabels = { unconnected: [] };
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
                if (skill) {
                    //openSkillDialog(skill);
                }
            }).data("skill", skills[i]);
        $("#pinwheels").append(label);
        
        // skill only has one connection
        if (skill.pinwheels.length < 2) {
            this.skillLabels.unconnected.push(label);
            label.css("top", (25 * this.skillLabels.unconnected.length) + 40);
        } else {
            var connection;
            for (var j = 0; j < skill.pinwheels.length; ++j) {
                if (skill.pinwheels[j] != this.currentNode.id) {
                    connection = skill.pinwheels[j];
                }
            }
            this.skillLabels[connection] = label;
        }
    }
}

// Add modified Dijkstra's shortest path algorithm to Node prototype
$jit.Graph.Node.prototype.shortestPathTo = function(destNode) {
    var sourceNode = this,
        directions = [],
        visited = [],
        prev = [],
        queue = [],
        foundDepth,
        depth = 0;

    queue.push({ node: sourceNode, depth: depth });
    visited.push(sourceNode);
    
    while (queue.length > 0) {
        var sourceNodeData = queue.shift();
        sourceNode = sourceNodeData.node;
        depth = sourceNodeData.depth;
        
        if (sourceNode === destNode) {
            foundDepth = depth;
        } else if (!foundDepth || (foundDepth && (depth + 1) <= foundDepth)) {
            sourceNode.eachSubnode(function (node) {
                if (visited.indexOf(node) === -1) {
                    queue.push({ node: node, depth: depth + 1 });
                    if (node != destNode) {
                        visited.push(node);
                    }
                    prev.push({ node: node, parent: sourceNode });
                }
            });
        }
    }
    
    // now find the paths back to the root
    var paths = new Array();
    var results = destNode.findIndex(prev, true);
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
            index = parent.findIndex(prev);
            count++;
        }
        
        directions.reverse();
        paths.push(directions);
    }
    
    return paths;
};

// Finds the index of a particular node in the arr argument
$jit.Graph.Node.prototype.findIndex = function(arr, findAll) {
    findAll = findAll || false;
    var indices = [];
    for (var i = 0; i < arr.length; ++i) {
        var obj = arr[i];
        if (this === obj.node) {
            if (findAll) {
                indices.push(i);
            } else {
                return i;
            }
        }
    }
    return (indices.length > 0) ? indices : -1;
};

$jit.RGraph.Plot.NodeTypes.implement({ 
    'stroke-circle': {  
        render: function(node, canvas) { 
            if (node.id.indexOf("dummy") !== -1) { return; }
         
            var pos = node.pos.getc(true), 
                radius = node.getData("dim"),
                strokeColor = node.getData("strokeStyle"),
                lineWidth = node.getData("lineWidth"),
                ctx = window.rgraph.canvas.getCtx();
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
                    skill = window.rgraph.skillLabels[connection.id];
                } else {
                    this.edgeHelper.line.render(root.pos.getc(true), {x: midX, y: midY}, canvas);
                    if (window.rgraph.skillLabels[connection.id]) {
                        skill = window.rgraph.skillLabels[connection.id];
                    } else {
                        skill = window.rgraph.skillLabels.unconnected.pop();
                        window.rgraph.skillLabels[connection.id] = skill;
                    }
                }
                
                if (skill) {
                    // Calculate the position of the label
                    var pos = { x: midX, y: midY }, 
                        ox = canvas.translateOffsetX,
                        oy = canvas.translateOffsetY,
                        sx = canvas.scaleOffsetX,
                        sy = canvas.scaleOffsetY,
                        radius = canvas.getSize(),
                        labelPos = {
                            left: Math.round(pos.x * sx + ox + radius.width / 2),
                            top: Math.round(pos.y * sy + oy + radius.height / 2)
                        },
                        left = labelPos.left - (parseInt(skill.css("width")) / 2);

                    // Place the appropriate label near the skill node
                    //position = $('#pinwheels').position();
                    skill.css({
                        top: labelPos.top,
                        left: left// + position.left
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
