import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data, width = 1000, height = 1000, onResetReady, yAxisLabel = 'Number of Interactions', xAxisLabel = 'Date' }) => {
  const svgRef = useRef();
  const zoomRef = useRef();

  const handleReset = useCallback(() => {
    if (zoomRef.current) {
      const { svg, zoom } = zoomRef.current;
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    }
  }, []);

  // Expose reset function to parent
  useEffect(() => {
    if (onResetReady && handleReset) {
      onResetReady(handleReset);
    }
  }, [onResetReady, handleReset]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    // Set up dimensions and margins
    const margin = { top: 20, right: 60, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales (store original domains for reset)
    const xScale = d3.scaleTime()
      .domain(d3.extent(data.individual, d => d.date))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max([
        ...data.individual.map(d => d.interactions),
        ...data.average.map(d => d.interactions)
      ])])
      .range([innerHeight, 0]);

    // Store original domains for reset
    const xDomain = xScale.domain();
    const yDomain = yScale.domain();

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

    // Add clip path to prevent drawing outside chart area
    const clipId = `clip-${Math.random().toString(36).substr(2, 9)}`;
    svg.append('defs').append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    // Add axes
    const xAxis = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%m/%d')))
      .style('color', '#666');

    const yAxis = g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale))
      .style('color', '#666');

    // Add axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .style('text-anchor', 'middle')
      .text(xAxisLabel);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -35)
      .style('text-anchor', 'middle')
      .text(yAxisLabel);

    // Create a group for zoomable content
    const zoomGroup = g.append('g')
      .attr('clip-path', `url(#${clipId})`);

    // Add individual line
    const individualPath = zoomGroup.append('path')
      .datum(data.individual)
      .attr('class', 'individual-line')
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3)
      .attr('d', individualLine);

    // Add average line
    const averagePath = zoomGroup.append('path')
      .datum(data.average)
      .attr('class', 'average-line')
      .attr('fill', 'none')
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5')
      .attr('d', averageLine);

    // Add dots for individual data points
    const individualDots = zoomGroup.selectAll('.individual-dot')
      .data(data.individual)
      .enter().append('circle')
      .attr('class', 'individual-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.interactions))
      .attr('r', 4)
      .attr('fill', '#2563eb');

    // Add dots for average data points
    const averageDots = zoomGroup.selectAll('.average-dot')
      .data(data.average)
      .enter().append('circle')
      .attr('class', 'average-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.interactions))
      .attr('r', 4)
      .attr('fill', '#dc2626');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 20}, 0)`);

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

    // Zoom function - only affects X-axis, Y-axis auto-normalizes
    const updateChart = (event) => {
      const newXScale = event.transform.rescaleX(xScale);

      // Get visible date range
      const [minDate, maxDate] = newXScale.domain();

      // Number of days available
      const dateRange = (maxDate-minDate)/ (1000*60*60*24);
      let tickCount;
      if (dateRange > 180){
        tickCount = 6;
      } else if (dateRange > 90) {
        tickCount = 8;
      } else if (dateRange > 30) {
        tickCount = 10;
      } else if (dateRange > 14) {
        tickCount = 10;
      } else {
        tickCount = Math.min(Math.floor(dateRange), 10); 
      }

      // Filter data to visible range
      const visibleIndividual = data.individual.filter(d => d.date >= minDate && d.date <= maxDate);
      const visibleAverage = data.average.filter(d => d.date >= minDate && d.date <= maxDate);

      // Calculate Y-axis domain based on visible data
      const allVisibleValues = [
        ...visibleIndividual.map(d => d.interactions),
        ...visibleAverage.map(d => d.interactions)
      ];
      
      const yMin = allVisibleValues.length > 0 ? Math.min(...allVisibleValues) : 0;
      const yMax = allVisibleValues.length > 0 ? Math.max(...allVisibleValues) : 1;
      
      // Add 10% padding to Y-axis
      const yPadding = (yMax - yMin) * 0.1;
      const newYScale = d3.scaleLinear()
        .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
        .range([innerHeight, 0]);
      const tickValues = newXScale.ticks(tickCount);
      const tickArray = tickValues.length > 10 
        ? tickValues.filter((_, i) => i % Math.ceil(tickValues.length / 10) === 0).slice(0, 10)
        : tickValues;
      // Update axes
      xAxis.call(
        d3.axisBottom(newXScale)
        .tickValues(tickArray)
        .tickFormat(d3.timeFormat('%m/%d')));
      yAxis.transition().duration(200).call(d3.axisLeft(newYScale));

      // Update line generators with new scales
      const newIndividualLine = d3.line()
        .x(d => newXScale(d.date))
        .y(d => newYScale(d.interactions))
        .curve(d3.curveMonotoneX);

      const newAverageLine = d3.line()
        .x(d => newXScale(d.date))
        .y(d => newYScale(d.interactions))
        .curve(d3.curveMonotoneX);

      // Update paths
      individualPath.transition().duration(200).attr('d', newIndividualLine);
      averagePath.transition().duration(200).attr('d', newAverageLine);

      // Update dots
      individualDots.transition().duration(200)
        .attr('cx', d => newXScale(d.date))
        .attr('cy', d => newYScale(d.interactions));

      averageDots.transition().duration(200)
        .attr('cx', d => newXScale(d.date))
        .attr('cy', d => newYScale(d.interactions));
    };

    // Create zoom behavior - only affects X-axis (horizontal pan/zoom)
    const zoom = d3.zoom()
      .scaleExtent([1, 10]) // Min and max zoom levels
      .translateExtent([[-innerWidth * 5, 0], [innerWidth * 5, innerHeight]]) // Only horizontal pan
      .extent([[0, 0], [innerWidth, innerHeight]])
      .filter(function(event) {
        // Only allow horizontal pan and zoom
        return !event.ctrlKey && !event.button;
      })
      .on('zoom', updateChart);

    // Store zoom behavior in ref for external reset
    zoomRef.current = { svg, zoom };

    // Add zoom rectangle (invisible overlay for capturing zoom/pan events)
    const zoomRect = g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .style('cursor', 'ew-resize')
      .style('touch-action', 'none') // Prevent browser handling of touch gestures to fix violation warning
      .call(zoom)
      .on('mousedown', function() {
        d3.select(this).style('cursor', 'grabbing');
      })
      .on('mouseup', function() {
        d3.select(this).style('cursor', 'ew-resize');
      });

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

ZOOM CONTROLS:
- Scroll wheel: Zoom in/out on X-axis only
- Click and drag: Pan horizontally along X-axis
- Y-axis automatically normalizes to show visible data range
- External reset button: Pass onReset prop to get reset function
- Zoom range: 1x to 10x
*/