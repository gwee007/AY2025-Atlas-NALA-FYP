import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const TopicGraph = ({ selectedTopic, onTopicSelect, graphData, gradeData, width = 800, height = 600 }) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !graphData) return; // Removed selectedTopic check to allow rendering empty state

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const gradeLookup = new Map(
      gradeData?.map(g => [g.topic_name, g.avg_grade_letter]) || []
    );

    // 1. Helper to safely get ID from link (handles D3 object conversion)
    const getLinkId = (linkProp) => (typeof linkProp === 'object' ? linkProp.id : linkProp);

    // 2. Pre-process relationships: Map Subtopic ID -> Parent Topic ID
    // We do this to quickly check if a subtopic belongs to the selected topic
    const subtopicToParent = new Map();
    (graphData.links || []).forEach(link => {
      if (link.relation_type === 'subtopic_of') {
        const sourceId = getLinkId(link.source);
        const targetId = getLinkId(link.target);
        // Assuming link is FROM subtopic TO topic based on your previous logic
        subtopicToParent.set(sourceId, targetId); 
      }
    });

    // 3. Lookup maps
    const labelToIdMap = new Map(graphData.nodes?.map(n => [n.label, n.id]) || []);
    const selectedTopicId = selectedTopic ? labelToIdMap.get(selectedTopic) : null;

    // 4. FILTER NODES: The Core Logic Change
    const nodes = [];
    const visibleNodeIds = new Set();

    (graphData.nodes || []).forEach(rawNode => {
      // Create a fresh node object for D3
      const node = { 
        id: rawNode.id, 
        label: rawNode.label || rawNode.id, 
        type: rawNode.type,
        grade: gradeLookup.get(rawNode.label) || '' 
      };

      let isVisible = false;

      if (node.type === 'topic') {
        // RULE 1: Always show main topics
        isVisible = true;
        // visual distinction for selected vs unselected
        if (node.id === selectedTopicId) {
            node.group = 'root';
            node.radius = 45;
        } else {
            node.group = 'topic';
            node.radius = 40;
        }
      } else if (node.type === 'subtopic') {
        // RULE 2: Only show subtopics if their parent is the selected topic
        const parentId = subtopicToParent.get(node.id);
        if (parentId === selectedTopicId) {
            isVisible = true;
            node.group = 'subtopic';
            node.radius = 25;
        }
      }

      if (isVisible) {
        nodes.push(node);
        visibleNodeIds.add(node.id);
      }
    });

    // 5. FILTER LINKS: Only keep links connecting two visible nodes
    const links = (graphData.links || [])
      .filter(link => {
        const source = getLinkId(link.source);
        const target = getLinkId(link.target);
        return visibleNodeIds.has(source) && visibleNodeIds.has(target);
      })
      .map(link => ({
        source: getLinkId(link.source),
        target: getLinkId(link.target),
        relation_type: link.relation_type
      }));

    // --- STANDARD D3 SETUP BELOW (Unchanged) ---

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('border', '1px solid #ddd')
      .style('border-radius', '8px')
      .style('background-color', '#fafafa')
      .style('touch-action', 'none');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4]) // Increased zoom range for full graph visibility
      .filter((event) => !event.button && event.type !== 'dblclick')
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);

    const g = svg.append('g');

    // Arrowhead definition
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

    // Force Simulation - Tweaked for stability
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150)) // Shorter distance
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 20));

    // Draw Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.4)
      .attr('marker-end', 'url(#arrowhead)');

    // Draw Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .style('cursor', d => (d.type === 'topic' || d.group === 'root') ? 'pointer' : 'default')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', function(event, d) {
        event.stopPropagation();
        if (d.type === 'subtopic' || d.group === 'subtopic') return;
        onTopicSelect(d.label || d.id);
      });

    // Visuals (Circles)
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        if (d.group === 'root') return '#3b82f6';
        if (d.type === 'topic') return '#10b981';
        return '#8b5cf6';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('opacity', d => d.group === 'root' ? 1 : 0.7)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
      .on('mouseover', function(event, d) {
         // 1. Bring hovered node to front (so label isn't hidden)
         d3.select(this.parentNode).raise();

         // 2. Dim ALL nodes (fade out "everything else")
         node.transition().duration(200)
             .style('opacity', 0.3); // <--- The "Focus Mode" effect

         // 3. Dim ALL links
         link.transition().duration(200)
             .style('opacity', 0.3);

         // 4. Highlight THIS node (Parent Group)
         d3.select(this.parentNode)
           .transition().duration(200)
           .style('opacity', 1); // Keep this fully visible

         // 5. Expand the Circle (Visual effect)
         d3.select(this)
           .transition().duration(200)
           .attr('r', d.radius * 1.2); // Grow slightly larger

         // 6. Show the Label
         d3.select(this.parentNode).select('.node-label')
           .transition().duration(200)
           .style('opacity', 1);
      })
      .on('mouseout', function(event, d) {
         // 1. Reset ALL nodes to full visibility
         node.transition().duration(200)
             .style('opacity', 1);

         // 2. Reset ALL links
         link.transition().duration(200)
             .style('opacity', 1);

         // 3. Reset the Circle size
         d3.select(this)
           .transition().duration(200)
           .attr('r', d.radius);

         // 4. Hide the Label again
         d3.select(this.parentNode).select('.node-label')
           .transition().duration(200)
           .style('opacity', 0);
      });

    // Visuals (Grades)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', d => d.group === 'root' ? '24px' : '18px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => d.grade || '');

    // Visuals (Labels)
    node.append('text')
    .attr('class', 'node-label')
      .text(d => d.label)
      .attr('dx', d => d.radius + 8)
      .attr('dy', '0.35em')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#334155')
      .style('pointer-events', 'none')
      .style('opacity',0);

    // Simulation Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag Handlers
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

    return () => simulation.stop();

  }, [selectedTopic, width, height, onTopicSelect, graphData, gradeData]);

  return (
    <div style={{ position: 'relative', touchAction: 'none' }}>
      <svg ref={svgRef}></svg>
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.8)', padding: 5, borderRadius: 4, fontSize: 12 }}>
        Click a topic to expand subtopics
      </div>
    </div>
  );
};

export default TopicGraph;