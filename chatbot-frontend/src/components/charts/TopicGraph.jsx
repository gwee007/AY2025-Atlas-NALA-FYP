import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import API_BASE_URL, { API_ENDPOINTS } from '../../config/api';

/**
 * TopicGraph Component
 * A force-directed graph visualization showing topic dependencies
 * - Root node: Selected topic (larger circle)
 * - Child nodes: Subtopics connected to the root
 * - Interactive: Pan, zoom, and click to select topics
 */
const TopicGraph = ({ selectedTopic, onTopicSelect, width = 800, height = 600 }) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchDependencies = async () => {
        if (!selectedTopic) return;
        console.log('Fetching dependencies: ', selectedTopic)
        setLoading(true);
        try {
          const response = await fetch(API_ENDPOINTS.topicDependencies, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic_id: selectedTopic })
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch dependencies');
          }
          
          const dependencies = await response.json();
          
          // Transform API response into nodes and links
          const nodesSet = new Set();
          const links = [];
          
          dependencies.forEach(dep => {
            nodesSet.add(dep.topic_id);
            nodesSet.add(dep.related_topic_id);
            
            links.push({
              source: dep.topic_id,
              target: dep.related_topic_id,
              relation_type: dep.relation_type
            });
          });
          
          const nodes = Array.from(nodesSet).map(id => ({
            id: id,
            radius: 25
          }));
          
          setGraphData({ nodes, links });
        } catch (error) {
          console.error('Error fetching graph information:', error);
        } finally {
          setLoading(false);
        }
        };

        fetchDependencies();
      }, [selectedTopic]);
    
  useEffect(() => {
    if (!svgRef.current || !selectedTopic || !graphData) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create graph data with selected topic as root
    // Define full dependency graph with ALL possible nodes (including a default set for any topic)
    const allNodesMap = new Map(
      graphData.nodes?.map(node => [node.id, { id: node.id, radius: 25 }]) || []
    );

    // Define all dependencies (directed: source depends on target)
    const allLinks = graphData.links ||[];

    
    // If selected topic is not in our subtopic list, add default children
    const isSubtopic = allNodesMap.has(selectedTopic);
    if (!isSubtopic) {
      // Add default children for any main topic
      allLinks.push(
        { source: selectedTopic, target: 'Subtopic 0' },
        { source: selectedTopic, target: 'Subtopic 1' }
      );
    }

    // Traverse graph to find all descendants up to depth 3-4
    const getDescendants = (nodeId, maxDepth = 4) => {
      const descendants = new Set();
      const visited = new Set();
      const queue = [{ id: nodeId, depth: 0 }];
      
      while (queue.length > 0) {
        const { id, depth } = queue.shift();
        
        if (depth >= maxDepth) continue;
        if (visited.has(id)) continue;
        visited.add(id);
        
        // Find all children of current node
        const children = allLinks
          .filter(link => link.source === id)
          .map(link => link.target);
        
        children.forEach(childId => {
          descendants.add(childId);
          queue.push({ id: childId, depth: depth + 1 });
        });
      }
      
      return Array.from(descendants);
    };
    
    // Get all descendants of selected topic
    const descendantIds = getDescendants(selectedTopic);
    
    // Build nodes array: root + descendants (excluding root from descendants to avoid duplicates)
    const nodes = [
      { id: selectedTopic, group: 'root', radius: 40 }
    ];
    
    // Add descendant nodes only if they exist in allNodesMap and aren't the selected topic
    descendantIds.forEach(id => {
      if (allNodesMap.has(id) && id !== selectedTopic) {
        nodes.push({ ...allNodesMap.get(id), group: 'child' });
      }
    });
    
    // Filter links to only include those within the descendant tree
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = allLinks.filter(link => 
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    // Setup SVG with zoom and pan
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('border', '1px solid #ddd')
      .style('border-radius', '8px')
      .style('background-color', '#fafafa');

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create main group for graph elements
    const g = svg.append('g');

    // Define arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
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
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 10));

    // Create links with arrows
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2.5)
      .attr('stroke-opacity', 0.7)
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

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        if (d.group === 'root') return '#3b82f6';
        if (d.group === 'grandchild') return '#ec4899';
        return '#8b5cf6';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
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
        onTopicSelect(d.id);
      });

    // Add labels for nodes (positioned to the right)
    node.append('text')
      .text(d => d.id)
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
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const angle = Math.atan2(dy, dx);
        const targetRadius = d.target.radius || 25;
        
        // Start from edge of source circle
        const sourceX = d.source.x + (d.source.radius || 40) * Math.cos(angle);
        const sourceY = d.source.y + (d.source.radius || 40) * Math.sin(angle);
        
        // End at edge of target circle
        const targetX = d.target.x - targetRadius * Math.cos(angle);
        const targetY = d.target.y - targetRadius * Math.sin(angle);
        
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

  }, [selectedTopic, width, height, onTopicSelect, graphData]);

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef}></svg>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        💡 Click nodes to select • Drag to reposition • Scroll to zoom
      </div>
    </div>
  );
};

export default TopicGraph;
