import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const VerticalBarChart = ({ data, width = 600, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    // Set up dimensions and margins
    const margin = { top: 40, right: 80, bottom: 80, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.categories)
      .range([0, innerWidth])
      .padding(0.3);

    const maxValue = d3.max([
      ...data.individualData.map(d => d.value),
      ...data.averageData.map(d => d.value)
    ]);

    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([innerHeight, 0]);

    // Create sub-scale for grouped bars
    const subXScale = d3.scaleBand()
      .domain(['individual', 'average'])
      .range([0, xScale.bandwidth()])
      .padding(0.1);

    // Add horizontal grid lines
    const yTicks = yScale.ticks(5);
    yTicks.forEach(tick => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(tick))
        .attr('y2', yScale(tick))
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1)
        .attr('opacity', 0.5);
    });

    // Individual bars
    g.selectAll('.individual-bar')
      .data(data.individualData)
      .enter().append('rect')
      .attr('class', 'individual-bar')
      .attr('x', d => xScale(d.category) + subXScale('individual'))
      .attr('y', d => yScale(d.value))
      .attr('width', subXScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.8)
      .attr('rx', 4);

    // Average bars
    g.selectAll('.average-bar')
      .data(data.averageData)
      .enter().append('rect')
      .attr('class', 'average-bar')
      .attr('x', d => xScale(d.category) + subXScale('average'))
      .attr('y', d => yScale(d.value))
      .attr('width', subXScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('fill', '#ef4444')
      .attr('opacity', 0.8)
      .attr('rx', 4);

    // Add value labels on individual bars
    g.selectAll('.individual-label')
      .data(data.individualData)
      .enter().append('text')
      .attr('class', 'individual-label')
      .attr('x', d => xScale(d.category) + subXScale('individual') + subXScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#3b82f6')
      .style('font-weight', 'bold')
      .text(d => d.value);

    // Add value labels on average bars
    g.selectAll('.average-label')
      .data(data.averageData)
      .enter().append('text')
      .attr('class', 'average-label')
      .attr('x', d => xScale(d.category) + subXScale('average') + subXScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#ef4444')
      .style('font-weight', 'bold')
      .text(d => d.value);

    // Add x-axis
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#666')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Add y-axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#666');

    // Add y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Performance Score');


    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth-20}, 0)`);

    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.8)
      .attr('rx', 2);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text('Individual')
      .style('font-size', '12px')
      .style('fill', '#333');

    legend.append('rect')
      .attr('y', 25)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#ef4444')
      .attr('opacity', 0.8)
      .attr('rx', 2);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 37)
      .text('Class Average')
      .style('font-size', '12px')
      .style('fill', '#333');

    // Add hover interactions
    g.selectAll('.individual-bar, .average-bar')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke', '#333')
          .attr('stroke-width', 2);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('opacity', 0.8)
          .attr('stroke', 'none');
      });

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default VerticalBarChart;

/*
USAGE GUIDE:
============

To use this VerticalBarChart component, pass data in the following format:

const chartData = {
  categories: ['Category A', 'Category B', 'Category C', 'Category D'],
  individualData: [
    { category: 'Category A', value: 85 },
    { category: 'Category B', value: 78 },
    { category: 'Category C', value: 92 },
    { category: 'Category D', value: 76 }
  ],
  averageData: [
    { category: 'Category A', value: 79 },
    { category: 'Category B', value: 82 },
    { category: 'Category C', value: 75 },
    { category: 'Category D', value: 85 }
  ],
  title: 'Performance Comparison'
};

<VerticalBarChart data={chartData} width={600} height={400} />

DATA STRUCTURE EXPLANATION:
- categories: Array of category names (appears on x-axis)
- individualData: Array of objects for individual performance bars
- averageData: Array of objects for class average bars
- Each data object should have:
  - category: String (must match categories array)
  - value: Number (bar height)
- title: Chart title

FEATURES:
- Grouped vertical bars for comparison
- Interactive hover effects
- Value labels on each bar
- Grid lines for easier reading
- Responsive to width/height props
- Automatic scaling based on max values
- Rotated x-axis labels for better readability

USE CASES:
- Individual vs class average performance
- Taxonomy-based assessments
- Skill comparisons
- Subject performance analysis
*/