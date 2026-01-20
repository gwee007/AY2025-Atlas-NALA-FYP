import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TopicGraph = ({ selectedTopic, onTopicSelect, graphData, width = 800, height = 600, onResetReady }) => {
  const svgRef = useRef(null);
  const zoomRef = useRef(null);

  // Helper: Get Color based on Grade Letter
  const getGradeColor = (grade) => {
      if (!grade || grade === 'N/A') return '#cbd5e1';
      const letter = grade.charAt(0).toUpperCase();
      switch (letter) {
          case 'A': return '#10b981';
          case 'B': return '#3b82f6';
          case 'C': return '#eab308';
          case 'D': return '#f97316';
          case 'F': return '#ef4444';
          default: return '#cbd5e1';
      }
  };

  useEffect(() => {
    if (!svgRef.current || !graphData) return;

    // Clear canvas
    d3.select(svgRef.current).selectAll('*').remove();

    // ---------------------------------------------------------
    // 1. PRE-PROCESS RELATIONSHIPS & LOOKUPS
    // ---------------------------------------------------------
    const getLinkId = (linkProp) => (typeof linkProp === 'object' ? linkProp.id : linkProp);
    
    // Map Subtopic -> Parent Topic (for visibility logic)
    const subtopicToParent = new Map();
    (graphData.links || []).forEach(link => {
      if (link.relation_type === 'subtopic_of') {
        const sourceId = getLinkId(link.source);
        const targetId = getLinkId(link.target);
        subtopicToParent.set(sourceId, targetId); 
      }
    });
    
    const labelToIdMap = new Map(graphData.nodes?.map(n => [n.label, n.id]) || []);
    const selectedTopicId = selectedTopic ? labelToIdMap.get(selectedTopic) : null;

    // ---------------------------------------------------------
    // 2. FILTER & PREPARE NODES
    // ---------------------------------------------------------
    const nodes = [];
    const visibleNodeIds = new Set();

    (graphData.nodes || []).forEach(rawNode => {
      // Create D3 Node (Spread rawNode to keep grade, type, etc.)
      const node = { 
        ...rawNode, 
        x: Math.random() * width, // Random start pos prevents stack overflow
        y: Math.random() * height
      };
      
      let isVisible = false;

      // Visibility Rule 1: Always show main topics
      if (node.type === 'topic') {
        isVisible = true;
        node.group = (node.id === selectedTopicId) ? 'root' : 'topic';
        node.radius = (node.id === selectedTopicId) ? 45 : 40;
      } 
      // Visibility Rule 2: Show subtopics ONLY if parent is selected
      else if (node.type === 'subtopic') {
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

    // ---------------------------------------------------------
    // 3. FILTER LINKS
    // ---------------------------------------------------------
    const links = (graphData.links || [])
      .filter(link => {
        const source = getLinkId(link.source);
        const target = getLinkId(link.target);
        return visibleNodeIds.has(source) && visibleNodeIds.has(target);
      })
      .map(link => ({
        source: getLinkId(link.source),
        target: getLinkId(link.target),
        relation_type: link.relation_type,
        id: link.id // Keep ID if exists
      }));

    // ---------------------------------------------------------
    // 4. D3 VISUALIZATION SETUP
    // ---------------------------------------------------------
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('border', '1px solid #ddd')
      .style('border-radius', '8px')
      .style('background-color', '#fafafa')
      .style('touch-action', 'none');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .filter((event) => !event.button && event.type !== 'dblclick')
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);
    zoomRef.current = zoom;
    const g = svg.append('g');

    // Provide reset function to parent
    if (onResetReady && typeof onResetReady === 'function') {
      onResetReady(() => {
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity
        );
      });
    }

    // Define Arrow Markers
    const defs = svg.append('defs');
    const createMarker = (id, offset) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', offset)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#94a3b8')
        .style('stroke', 'none');
    };
    createMarker('arrow-root', 55);
    createMarker('arrow-topic', 50);
    createMarker('arrow-subtopic', 35);

    // Force Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 20));

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Draw Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => {
          const targetId = (typeof d.target === 'object') ? d.target.id : d.target;
          const targetNode = nodeMap.get(targetId);
          if (!targetNode) return null;
          if (targetNode.group === 'root') return 'url(#arrow-root)';
          if (targetNode.type === 'topic') return 'url(#arrow-topic)';
          return 'url(#arrow-subtopic)';
      });

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

    // Node Visuals (Circles)
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => getGradeColor(d.grade))
      .attr('stroke', d => {
        if (d.group === 'root') return '#1e293b';  // Selected topic: dark outline
        if (d.type === 'topic') return '#3b82f6';  // Unselected topics: blue outline
        return '#fff';  // Subtopics: white outline
      })
      .attr('stroke-width', d => d.group === 'root' ? 8 : 5)
      .attr('opacity', d => d.group === 'root' ? 1 : 0.9)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
      .on('mouseover', function(event, d) {
         const connectedNodeIds = new Set();
         connectedNodeIds.add(d.id);

         link.each(function(l) {
             const isSource = l.source.id === d.id;
             const isTarget = l.target.id === d.id;
             
             if (isSource || isTarget) {
                 const neighborNode = isSource ? l.target : l.source;
                 const isHoveringMainTopic = (d.type === 'topic' || d.group === 'root');
                 const isNeighborSubtopic = (neighborNode.type === 'subtopic' || neighborNode.group === 'subtopic');

                 if (isHoveringMainTopic && isNeighborSubtopic) return;
                 connectedNodeIds.add(neighborNode.id);
             }
         });

         // Highlight Logic
         node.transition().duration(200).style('opacity', n => connectedNodeIds.has(n.id) ? 1 : 0.1);
         link.transition().duration(200).style('opacity', l => {
                 const isConnected = l.source.id === d.id || l.target.id === d.id;
                 const isBothVisible = connectedNodeIds.has(l.source.id) && connectedNodeIds.has(l.target.id);
                 return (isConnected && isBothVisible) ? 1 : 0.05;
             })
             .attr('stroke', l => {
                 const isConnected = l.source.id === d.id || l.target.id === d.id;
                 const isBothVisible = connectedNodeIds.has(l.source.id) && connectedNodeIds.has(l.target.id);
                 return (isConnected && isBothVisible) ? '#3b82f6' : '#64748b';
             })
             .attr('stroke-width', l => {
                 const isConnected = l.source.id === d.id || l.target.id === d.id;
                 const isBothVisible = connectedNodeIds.has(l.source.id) && connectedNodeIds.has(l.target.id);
                 return (isConnected && isBothVisible) ? 3 : 2;
             });

         node.select('.node-label').transition().duration(200).style('opacity', n => connectedNodeIds.has(n.id) ? 1 : 0);
         d3.select(this).transition().duration(200).attr('r', d.radius * 1.2);
      })
      .on('mouseout', function(event, d) {
         node.transition().duration(200).style('opacity', 1);
         link.transition().duration(200).style('opacity', 0.4).attr('stroke', '#64748b').attr('stroke-width', 2);
         d3.select(this).transition().duration(200).attr('r', d.radius);
         node.select('.node-label').transition().duration(200).style('opacity', 0);
      });

    // Node Text (Grades)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', d => d.group === 'root' ? '24px' : '18px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => (d.grade === 'N/A' || !d.grade) ? '' : d.grade);
    
    // Node Labels (Hidden by default)
    node.append('text')
    .attr('class', 'node-label')
      .text(d => d.label)
      .attr('dx', d =>d.group === 'root' ? d.radius + 14: d.radius +11)
      .attr('dy', '0.35em')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#334155')
      .style('pointer-events', 'none')
      .style('opacity',0);

    // Simulation Handlers
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => simulation.stop();

  }, [selectedTopic, width, height, onTopicSelect, graphData]);

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