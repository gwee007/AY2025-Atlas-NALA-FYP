import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data, width = 1400, height = 1000, yAxisLabel = 'Number of Interactions', xAxisLabel = 'Date' }) => {
  const svgRef = useRef();
  const [viewMode, setViewMode] = useState('global');
  const [weekOffset, setWeekOffset] = useState(0);

  // Monday as the first day of the week
  const getStartOfWeek = useCallback((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Shift Sunday back six days, others back to Monday
    d.setDate(d.getDate() + diff);
    return d;
  }, []);

  const getSelectedWeekRange = useCallback(() => {
    const baseWeekStart = getStartOfWeek(new Date());
    const start = d3.timeDay.offset(baseWeekStart, weekOffset * 7);
    const end = d3.timeDay.offset(start, 7);
    return { start, end };
  }, [getStartOfWeek, weekOffset]);

  // Helper function to calculate 5-day moving average (handles null values)
  const calculateMovingAverage = (data, windowSize = 5) => {
    return data.map((d, i) => {
      // Skip calculation if current point is null, undefined, or NaN
      if (d.interactions === null || d.interactions === undefined || isNaN(d.interactions)) {
        return { date: d.date, interactions: null };
      }
      
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
      
      // Filter out null, undefined, and NaN values
      const window = data.slice(start, end).filter(item => 
        item.interactions !== null && 
        item.interactions !== undefined && 
        !isNaN(item.interactions)
      );
      
      // If not enough valid points, return null
      if (window.length === 0) {
        return { date: d.date, interactions: null };
      }
      
      const average = window.reduce((sum, item) => sum + item.interactions, 0) / window.length;
      return { date: d.date, interactions: average };
    });
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content    
    // Prevent text selection during drag
    svg.style('user-select', 'none')
       .style('-webkit-user-select', 'none')
       .style('-moz-user-select', 'none')
       .style('-ms-user-select', 'none');
    // Set up dimensions and margins (leave space for button at top, legend on right)
    const margin = { top: 50, right: 130, bottom: 80, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Determine date range based on view mode
    const allDates = data.individual.map(d => d.date);
    const [minDate, maxDate] = d3.extent(allDates);
    const { start: weekStart, end: weekEnd } = getSelectedWeekRange();
    const xDomain = viewMode === 'weekly'
      ? [weekStart, weekEnd]
      : [minDate, maxDate];

    // Create scales
    const xScale = d3.scaleTime()
      .domain(xDomain)
      .range([0, innerWidth]);

    // Filter data to visible range
    const visibleIndividual = data.individual.filter(d => d.date >= xDomain[0] && d.date <= xDomain[1]);
    const visibleAverage = data.average.filter(d => d.date >= xDomain[0] && d.date <= xDomain[1]);

    // Calculate Y-axis domain based on visible data (excluding null values)
    const allVisibleValues = [
      ...visibleIndividual.filter(d => d.interactions !== null && !isNaN(d.interactions)).map(d => d.interactions),
      ...visibleAverage.filter(d => d.interactions !== null && !isNaN(d.interactions)).map(d => d.interactions)
    ];
    
    const yMin = allVisibleValues.length > 0 ? Math.min(...allVisibleValues) : 0;
    const yMax = allVisibleValues.length > 0 ? Math.max(...allVisibleValues) : 1;
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = d3.scaleLinear()
      .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
      .range([innerHeight, 0]);

    // Create line generators with smoothing and gap handling
    const individualLine = d3.line()
      .defined(d => d.interactions !== null && !isNaN(d.interactions))  // Don't draw line through null/NaN values
      .x(d => xScale(d.date))
      .y(d => yScale(d.interactions))
      .curve(d3.curveMonotoneX);

    const averageLine = d3.line()
      .defined(d => d.interactions !== null && !isNaN(d.interactions))  // Don't draw line through null/NaN values
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

    // Add axes with per-mode tick logic
    const weeklyTickValues = d3.timeDays(xDomain[0], xDomain[1]);
    const xAxisGenerator = viewMode === 'weekly'
      ? d3.axisBottom(xScale)
          .tickValues(weeklyTickValues)
          .tickFormat(d3.timeFormat('%a %d %b'))
      : d3.axisBottom(xScale)
          .ticks(7) // cap at 7 ticks globally
          .tickFormat(d3.timeFormat('%m/%d'));

    const xAxis = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxisGenerator)
      .style('color', '#666');
    
    // Rotate x-axis labels for better readability
    xAxis.selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    const yAxis = g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale))
      .style('color', '#666');

    // Add axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 60)
      .style('text-anchor', 'middle')
      .text(xAxisLabel);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -35)
      .style('text-anchor', 'middle')
      .text(yAxisLabel);

    // Create a group for content
    const contentGroup = g.append('g')
      .attr('clip-path', `url(#${clipId})`);

    // Calculate moving averages
    const individualMovingAvg = calculateMovingAverage(visibleIndividual, 3);
    const averageMovingAvg = calculateMovingAverage(visibleAverage, 3);

    // Add faded dots for individual data points
    contentGroup.selectAll('.individual-dot')
      .data(visibleIndividual.filter(d => d.interactions !== null && !isNaN(d.interactions)))
      .enter()
      .append('circle')
      .attr('class', 'individual-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.interactions))
      .attr('r', 3)
      .attr('fill', '#2563eb')
      .attr('opacity', 0.3)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Add faded dots for average data points
    contentGroup.selectAll('.average-dot')
      .data(visibleAverage.filter(d => d.interactions !== null && !isNaN(d.interactions)))
      .enter()
      .append('circle')
      .attr('class', 'average-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.interactions))
      .attr('r', 3)
      .attr('fill', '#dc2626')
      .attr('opacity', 0.3)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
      
    // Add individual line (use visible data) - thinner for daily data
    const individualPath = contentGroup.append('path')
      .datum(visibleIndividual)
      .attr('class', 'individual-line')
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2)
      .attr('opacity', 0.2)
      .attr('d', individualLine);

    // Add individual moving average line - thicker for trend
    const individualMAPath = contentGroup.append('path')
      .datum(individualMovingAvg)
      .attr('class', 'individual-ma-line')
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 4)
      .attr('d', individualLine);

    // Add average line (use visible data) - thinner for daily data
    const averagePath = contentGroup.append('path')
      .datum(visibleAverage)
      .attr('class', 'average-line')
      .attr('fill', 'none')
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 2)
      .attr('opacity', 0.2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', averageLine);

    // Add average moving average line - thicker for trend
    const averageMAPath = contentGroup.append('path')
      .datum(averageMovingAvg)
      .attr('class', 'average-ma-line')
      .attr('fill', 'none')
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 4)
      .attr('stroke-dasharray', '5,5')
      .attr('d', averageLine);

    // Add legend outside chart (positioned relative to SVG, not the translated group)
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, ${margin.top + 20})`);

    // Individual line legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 4);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 5)
      .text('Individual Trend')
      .style('font-size', '12px');

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 18)
      .attr('y2', 18)
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2)
      .attr('opacity', 0.2);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 23)
      .text('Individual Data')
      .style('font-size', '12px');

    // Average line legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 36)
      .attr('y2', 36)
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 4)
      .attr('stroke-dasharray', '5,5');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 41)
      .text('Average Trend')
      .style('font-size', '12px');

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 54)
      .attr('y2', 54)
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 2)
      .attr('opacity', 0.2)
      .attr('stroke-dasharray', '5,5');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 59)
      .text('Average Data')
      .style('font-size', '12px');

    // No panning/zoom; view controlled via buttons

  }, [data, width, height, viewMode, weekOffset, getSelectedWeekRange]);

  const { start: controlWeekStart } = getSelectedWeekRange();
  const controlWeekEnd = d3.timeDay.offset(controlWeekStart, 6);
  const weekLabel = `${d3.timeFormat('%b %d')(controlWeekStart)} - ${d3.timeFormat('%b %d')(controlWeekEnd)}`;

  const primaryButtonStyle = (isActive) => ({
    padding: '6px 12px',
    cursor: isActive ? 'default' : 'pointer',
    borderRadius: '6px',
    border: '1px solid #2563eb',
    backgroundColor: '#e0ebff',
    color: '#0f172a',
    fontWeight: isActive ? 700 : 500,
    opacity: isActive ? 1 : 0.55,
    boxShadow: isActive ? '0 0 0 2px rgba(37, 99, 235, 0.25)' : 'none',
    transition: 'opacity 120ms ease, box-shadow 120ms ease',
  });

  const arrowButtonStyle = {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setViewMode('global'); }}
            disabled={viewMode === 'global'}
            style={primaryButtonStyle(viewMode === 'global')}
          >
            All Time
          </button>
          <button
            onClick={() => { setWeekOffset(0); setViewMode('weekly'); }}
            disabled={viewMode === 'weekly'}
            style={primaryButtonStyle(viewMode === 'weekly')}
          >
            Weekly
          </button>
        </div>
        {viewMode === 'weekly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setWeekOffset(prev => prev - 1)} style={arrowButtonStyle}>← Prev week</button>
            <span style={{ fontSize: '14px', color: '#444' }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(prev => prev + 1)} style={arrowButtonStyle}>Next week →</button>
          </div>
        )}
      </div>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
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

VIEW MODES:
- Toggle buttons switch between:
  * Global view: Shows all data with a maximum of 7 x-axis ticks.
  * Weekly view: Shows the selected week (Monday-Sunday). Use the arrows to move across weeks; defaults to the current week and aligns ticks to each day starting on Monday.
- Y-axis automatically normalizes to show visible data range
*/