import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data, width = 600, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    // Set up dimensions and margins
    const margin = { top: 20, right: 80, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data.individual, d => d.date))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max([
        ...data.individual.map(d => d.interactions),
        ...data.average.map(d => d.interactions)
      ])])
      .range([innerHeight, 0]);

    // Create line generators
    const individualLine = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.interactions))
      .curve(d3.curveMonotoneX);

    const averageLine = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.interactions))
      .curve(d3.curveMonotoneX);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);


    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%m/%d')))
        .style('color', '#666');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .style('color', '#666');

    // Add axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .style('text-anchor', 'middle')
      .text('Date');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -35)
      .style('text-anchor', 'middle')
      .text('Number of Interactions');

    // Add individual line
    g.append('path')
      .datum(data.individual)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3)
      .attr('d', individualLine);

    // Add average line
    g.append('path')
      .datum(data.average)
      .attr('fill', 'none')
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5')
      .attr('d', averageLine);

    // Add dots for individual data points
    g.selectAll('.individual-dot')
      .data(data.individual)
      .enter().append('circle')
      .attr('class', 'individual-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.interactions))
      .attr('r', 4)
      .attr('fill', '#2563eb');

    // Add dots for average data points
    g.selectAll('.average-dot')
      .data(data.average)
      .enter().append('circle')
      .attr('class', 'average-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.interactions))
      .attr('r', 4)
      .attr('fill', '#dc2626');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 120}, 20)`);

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 5)
      .text('Individual')
      .style('font-size', '12px');

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 20)
      .attr('y2', 20)
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 25)
      .text('Average')
      .style('font-size', '12px');

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default LineChart;

/*
USAGE GUIDE:
============

To use this LineChart component, pass data in the following format:

const chartData = {
  individual: [
    { date: new Date('2024-01-01'), interactions: 15 },
    { date: new Date('2024-01-02'), interactions: 23 },
    { date: new Date('2024-01-03'), interactions: 18 },
    // ... more data points
  ],
  average: [
    { date: new Date('2024-01-01'), interactions: 20 },
    { date: new Date('2024-01-02'), interactions: 22 },
    { date: new Date('2024-01-03'), interactions: 21 },
    // ... more data points (should match individual dates)
  ]
};

<LineChart data={chartData} width={600} height={400} />

DATA STRUCTURE EXPLANATION:
- individual: Array of objects with user's daily interaction data
- average: Array of objects with system-wide average interaction data
- Each object should have:
  - date: JavaScript Date object
  - interactions: Number representing count of interactions

STYLING:
- Individual line: Solid blue line (#2563eb)
- Average line: Dashed red line (#dc2626)
- Both lines have circular dots at data points
- Responsive to width/height props
*/