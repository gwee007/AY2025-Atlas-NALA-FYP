import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SpiderChart = ({ data, width = 500, height = 500 }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    // Configuration
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;
    const levels = 5; // Number of concentric circles
    const maxValue = 100; // Maximum value on the scale
    
    // Center the chart
    const centerX = width / 2;
    const centerY = height / 2;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    // Calculate angles for each category (6 categories = 60 degrees apart)
    const angleSlice = (Math.PI * 2) / data.categories.length;

    // Draw concentric circles (grid)
    for (let level = 1; level <= levels; level++) {
      g.append('circle')
        .attr('r', radius * (level / levels))
        .attr('fill', 'none')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1);
    }

    // Draw radial lines
    data.categories.forEach((category, i) => {
      const angle = angleSlice * i - Math.PI / 2; // Start from top
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', radius * Math.cos(angle))
        .attr('y2', radius * Math.sin(angle))
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1);
    });

    // Add category labels
    data.categories.forEach((category, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = radius + 20;
      const x = labelRadius * Math.cos(angle);
      const y = labelRadius * Math.sin(angle);
      
      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(category.name);
    });

    // Add scale labels
    for (let level = 1; level <= levels; level++) {
      const value = (maxValue * level) / levels;
      g.append('text')
        .attr('x', 5)
        .attr('y', -radius * (level / levels))
        .attr('text-anchor', 'start')
        .style('font-size', '10px')
        .style('fill', '#666')
        .text(value);
    }

    // Create line generator for radar chart
    const radarLine = d3.lineRadial()
      .angle((d, i) => angleSlice * i)
      .radius(d => (radius * d) / maxValue)
      .curve(d3.curveLinearClosed);

    // Draw individual performance area
    const individualValues = data.categories.map(cat => cat.individual);
    g.append('path')
      .datum(individualValues)
      .attr('d', radarLine)
      .attr('fill', '#2563eb')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2);

    // Draw average performance area
    const averageValues = data.categories.map(cat => cat.average);
    g.append('path')
      .datum(averageValues)
      .attr('d', radarLine)
      .attr('fill', '#dc2626')
      .attr('fill-opacity', 0.2)
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Add individual points
    data.categories.forEach((category, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (radius * category.individual) / maxValue;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', '#2563eb')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    });

    // Add average points
    data.categories.forEach((category, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (radius * category.average) / maxValue;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', '#dc2626')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    });

    // Add legend
const legend = g.append('g')
  .attr('transform', `translate(${-radius - 60}, ${radius +10})`);


    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#2563eb')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text('Individual Performance')
      .style('font-size', '12px');

    legend.append('rect')
      .attr('y', 25)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#dc2626')
      .attr('fill-opacity', 0.2)
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3');

    legend.append('text')
      .attr('x', 20)
      .attr('y', 37)
      .text('Class Average')
      .style('font-size', '12px');

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default SpiderChart;

/*
USAGE GUIDE:
============

To use this SpiderChart component, pass data in the following format:

const spiderData = {
  categories: [
    { 
      name: 'Remembering', 
      individual: 85, 
      average: 78 
    },
    { 
      name: 'Understanding', 
      individual: 78, 
      average: 82 
    },
    { 
      name: 'Applying', 
      individual: 92, 
      average: 75 
    },
    { 
      name: 'Analyzing', 
      individual: 88, 
      average: 80 
    },
    { 
      name: 'Evaluating', 
      individual: 76, 
      average: 85 
    },
    { 
      name: 'Creating', 
      individual: 82, 
      average: 70 
    }
  ]
};

<SpiderChart data={spiderData} width={500} height={500} />

DATA STRUCTURE EXPLANATION:
- categories: Array of 6 objects representing Bloom's taxonomy levels
- Each category object should have:
  - name: String (category name)
  - individual: Number (0-100, user's performance score)
  - average: Number (0-100, class average score)

BLOOM'S TAXONOMY CATEGORIES:
1. Remembering: Recall facts and basic concepts
2. Understanding: Explain ideas or concepts
3. Applying: Use information in new situations
4. Analyzing: Draw connections among ideas
5. Evaluating: Justify a stand or decision
6. Creating: Produce new or original work

STYLING:
- Individual area: Solid blue fill with transparency
- Average area: Dashed red outline with transparency
- Scale: 0-100 with 5 concentric levels (20, 40, 60, 80, 100)
- Responsive to width/height props
*/