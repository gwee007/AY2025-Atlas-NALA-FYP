import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

/**
 * TopicGraph Component
 * A force-directed graph visualization showing topic dependencies
 * - Displays topics and subtopics with their relationships
 * - Root node: Selected topic (larger blue circle)
 * - Child nodes: Related topics/subtopics (purple/pink circles)
 * - Interactive: Pan, zoom, drag nodes, and click to select
 */
const TopicGraph = ({ selectedTopic, onTopicSelect, graphData,gradeData, width = 800, height = 600 }) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  console.log('TopicGraph reloaded, selectedTopic:', selectedTopic);
  


  useEffect(() => {
    if (!svgRef.current || !selectedTopic || !graphData) {
      console.log('Early return - missing:', { svgRef: !!svgRef.current, selectedTopic, hasGraphData: !!graphData });
      return;
    }
    
    console.log('Rendering graph for topic:', selectedTopic);
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const gradeLookup = new Map(
      gradeData?.map(g => [g.topic_name, g.avg_grade_letter]) || []
    );

    // Create a map for quick node lookup by ID
    const allNodesMap = new Map(
      graphData.nodes?.map(node => [node.id, { 
        id: node.id, 
        label: node.label || node.id, 
        type: node.type,
        radius: node.radius || (node.type === 'topic' ? 40 : 25),
        grade: gradeLookup.get(node.label) || ''
      }]) || []
    );

    

    // Create a map for quick node ID lookup by label (O(1) lookup time)
    const labelToIdMap = new Map(
      graphData.nodes?.map(node => [node.label, node.id]) || []
      
    );
  
    // Fast lookup function: Get node ID from label
    const getNodeNumber = (label) => {
      console.log('testing node look up: ', label)
      return labelToIdMap.get(label) || null;
    };

    // Get all links
    const allLinks = graphData.links || [];

    // Helper: Extract ID from link property (handle both string and object)
    const getLinkId = (linkProp) => {
      return typeof linkProp === 'object' ? linkProp.id : linkProp;
    };

    // Helper: Find parent topic of a subtopic (via "contains" relationship)
    const findParentTopic = (subtopicId) => {
      const parentLink = allLinks.find(link => {
        const sourceId = getLinkId(link.source);
        const targetId = getLinkId(link.target);
        return targetId === subtopicId && link.relation_type === 'contains' && sourceId.startsWith('t');
      });
      return parentLink ? getLinkId(parentLink.source) : null;
    };

    // Helper: Traverse prerequisite subtopics
    const traverseSubtopics = (startId, connected, visited, maxDepth) => {
      const queue = [{ id: startId, depth: 0 }];
      
      while (queue.length > 0) {
        const { id, depth } = queue.shift();
        
        if (visited.has(id)) continue;
        visited.add(id);
        
        if (depth >= maxDepth) continue;
        
        // Find prerequisite subtopics (only follow "prerequisite" or "related" links to other subtopics)
        allLinks.forEach(link => {
          const sourceId = getLinkId(link.source);
          const targetId = getLinkId(link.target);
          
          // Follow links where current subtopic depends on another subtopic (BACKWARD - prerequisites)
          if (sourceId === id && targetId.startsWith('s') && 
              (link.relation_type === 'prerequisite' || link.relation_type === 'related')) {
            if (!visited.has(targetId)) {
              connected.add(targetId);
              queue.push({ id: targetId, depth: depth + 1 });
            }
          }
          
          // Also follow links where another subtopic depends on current subtopic (FORWARD - next/dependent subtopics)
          if (targetId === id && sourceId.startsWith('s') && 
              (link.relation_type === 'prerequisite' || link.relation_type === 'related')) {
            if (!visited.has(sourceId)) {
              connected.add(sourceId);
              queue.push({ id: sourceId, depth: depth + 1 });
            }
          }
        });
      }
    };

    // Helper: Traverse prerequisite topics
    const traverseTopics = (startId, connected, visited, maxDepth) => {
      const queue = [{ id: startId, depth: 0 }];
      
      while (queue.length > 0) {
        const { id, depth } = queue.shift();
        
        if (visited.has(id)) continue;
        visited.add(id);
        
        if (depth >= maxDepth) continue;
        
        // Find prerequisite topics (only follow "prerequisite" or "related" links to other topics)
        allLinks.forEach(link => {
          const sourceId = getLinkId(link.source);
          const targetId = getLinkId(link.target);
          
          // Follow links where current topic depends on another topic
          if (sourceId === id && targetId.startsWith('t') && 
              (link.relation_type === 'prerequisite' || link.relation_type === 'related')) {
            if (!visited.has(targetId)) {
              connected.add(targetId);
              queue.push({ id: targetId, depth: depth + 1 });
            }
          }
        });
      }
    };

    // Helper: Get all subtopics that belong to a specific topic
    const getSubtopicsForTopic = (topicId, connected) => {
      allLinks.forEach(link => {
        const sourceId = getLinkId(link.source);
        const targetId = getLinkId(link.target);
        
        // Find "contains" links from this topic to subtopics
        if (sourceId === topicId && targetId.startsWith('s') && link.relation_type === 'contains') {
          connected.add(targetId);
        }
      });
    };

    // Main traversal function with custom logic based on node type
    const getConnectedNodes = (nodeId) => {
      const connected = new Set();
      const visited = new Set();
      
      console.log('Starting traversal from node:', nodeId);
      console.log('Node type:', nodeId.startsWith('s') ? 'SUBTOPIC' : 'TOPIC');
      
      const isSubtopic = nodeId.startsWith('s');
      
      if (isSubtopic) {
        // CASE 1: Starting from SUBTOPIC
        console.log('Subtopic traversal mode: up to 3 prerequisite subtopics + parent topic chain');
        
        // Step 1: Get up to 3 prerequisite subtopics
        traverseSubtopics(nodeId, connected, visited, 3);
        
        // Step 2: Find parent topic
        const parentTopic = findParentTopic(nodeId);
        if (parentTopic) {
          console.log('Found parent topic:', parentTopic);
          connected.add(parentTopic);
          visited.add(parentTopic);
          
          // Step 3: From parent topic, get prerequisite topics up to depth 2
          traverseTopics(parentTopic, connected, visited, 2);
        }
      } else {
        // CASE 2: Starting from TOPIC
        console.log('Topic traversal mode: up to 3 prerequisite topics + current topic subtopics only');
        
        // Step 1: Get prerequisite topics up to depth 3
        traverseTopics(nodeId, connected, visited, 3);
        
        // Step 2: Get ALL subtopics for the CURRENT topic only (not other topics)
        getSubtopicsForTopic(nodeId, connected);
      }
      
      console.log('Total connected nodes found:', connected.size);
      console.log('Connected nodes:', Array.from(connected));
      return Array.from(connected);
    };
    // Get all nodes connected to selected topic
    console.log("getting node number");
    const nodeNumber = getNodeNumber(selectedTopic);
    console.log("node number: ", nodeNumber);
    const connectedNodeIds = getConnectedNodes(nodeNumber);
    console.log('Connected node IDs: ',connectedNodeIds);
    
    // Build nodes array: root + connected nodes
    const rootNode = allNodesMap.get(nodeNumber);
    // console.log('Pulling from map: ',allNodesMap);// this appears to be working now
    console.log('Root node finding: ',rootNode);
    if (!rootNode) {
      console.warn('Selected topic not found in graph data:', selectedTopic);
      return;
    }

    const nodes = [
      { ...rootNode, group: 'root', radius: 45 }
    ];

    // Add connected nodes
    connectedNodeIds.forEach(id => {
      if (allNodesMap.has(id)) {
        const node = allNodesMap.get(id);
        nodes.push({ 
          ...node, 
          group: node.type === 'topic' ? 'topic' : 'subtopic'
        });
      }
    });

    console.log('Final nodes array:', nodes);
    
    // Filter links to only include those within the connected graph
    // Create COPIES to prevent D3 mutation issues
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = allLinks
      .filter(link => {
        const sourceId = getLinkId(link.source);
        const targetId = getLinkId(link.target);
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      })
      .map(link => ({
        source: getLinkId(link.source),
        target: getLinkId(link.target),
        relation_type: link.relation_type
      }));
    
    console.log('Final links array:', links);
    console.log('Number of links:', links.length);

    // Setup SVG with zoom and pan
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('border', '1px solid #ddd')
      .style('border-radius', '8px')
      .style('background-color', '#fafafa')
      .style('touch-action', 'none'); // Prevent browser handling of touch gestures to fix violation warning

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });'to'

    svg.call(zoom);

    // Create main group for graph elements
    const g = svg.append('g');
  
    // Define arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('opacity', 0.3)
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b');

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(200))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 10));

    // Create links with arrows
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2.5)
      .attr('stroke-opacity', 0.4)
      .attr('marker-end', 'url(#arrowhead)');

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles for nodes with different colors based on type
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        if (d.group === 'root') return '#3b82f6'; // Blue for root (selected topic)
        if (d.type === 'topic') return '#10b981'; // Green for other topics
        return '#8b5cf6'; // Purple for subtopics
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('opacity', d => d.group === 'root' ? 1 : 0.5)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => d.radius * 1.1)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => d.radius)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        onTopicSelect(d.label || d.id);
      });
    
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.25em')
      .style('font-size', d => d.group === 'root' ? '27px' : '20px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .text(d => d.grade || '');
    // Add labels for nodes (positioned to the right)
    node.append('text')
      .text(d => d.label || d.id)
      .attr('text-anchor', 'start')
      .attr('dx', d => d.radius + 10)
      .attr('dy', '0.35em')
      .style('font-size', d => d.group === 'root' ? '20px' : '15px')
      .style('font-weight', d => d.group === 'root' ? 'bold' : '600')
      .style('fill', '#334155')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      // Calculate link positions with proper arrow placement
      link.each(function(d) {
        // SWAP: Calculate from target to source instead
        const dx = d.source.x - d.target.x; // Changed order
        const dy = d.source.y - d.target.y; // Changed order
        const angle = Math.atan2(dy, dx);
        const sourceRadius = d.source.radius || 40; // Changed to source radius
        
        // SWAP: Start from edge of target circle
        const sourceX = d.target.x + (d.target.radius || 25) * Math.cos(angle);
        const sourceY = d.target.y + (d.target.radius || 25) * Math.sin(angle);
        
        // SWAP: End at edge of source circle
        const targetX = d.source.x - sourceRadius * Math.cos(angle);
        const targetY = d.source.y - sourceRadius * Math.sin(angle);
        
        d3.select(this)
          .attr('x1', sourceX)
          .attr('y1', sourceY)
          .attr('x2', targetX)
          .attr('y2', targetY);
      });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      setIsDragging(true);
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      setIsDragging(false);
    }

    // Cleanup
    return () => {
      simulation.stop();
    };

  }, [selectedTopic, width, height, onTopicSelect, graphData, gradeData]);

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef}></svg>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        Click nodes to select. Drag to reposition. Scroll to zoom.
      </div>
    </div>
  );
};

export default TopicGraph;
