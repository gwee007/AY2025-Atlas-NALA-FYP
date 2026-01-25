import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ReflectiveBarChart = ({ data, width = 600, height = 500, onCategoryClick, selectedCategory }) => {
  const svgRef = useRef();
      function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 1.1, // ems
              y = text.attr("y"),

              x = text.attr("x"),
              dy = parseFloat(text.attr("dy")) || 0,
              tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
             tspan = text.append("tspan")
              .attr("x", x)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
            }
          }
        });
      }

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear previous content

    // Set up dimensions and margins
    const margin = { top: 40, right: 20, bottom: 60, left: 250 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .style('color', '#666');

    // Create scales
    const yScale = d3.scaleBand()
      .domain(data.categories)
      .range([0, innerHeight])
      .padding(0.3);

    // Find max value for symmetric scale
    const maxValue = d3.max([
      ...data.leftData.map(d => Math.abs(d.value)),
      ...data.rightData.map(d => Math.abs(d.value))
    ]);

     
    // Add margin so bars don't touch axes
    const barMargin = maxValue * 0.25; // 5% of max value as margin


    const xScale = d3.scaleLinear()
      .domain([-maxValue - barMargin, maxValue + barMargin])
      .range([0, innerWidth]);

    // Add center line (y-axis)
    g.append('line')
      .attr('x1', innerWidth / 2)
      .attr('x2', innerWidth / 2)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .attr('opacity', 0.7);

    // Add vertical grid lines (x-axis)
    const ticks = xScale.ticks(5);
    ticks.forEach(tick => {
      if (tick !== 0) {
        g.append('line')
          .attr('x1', xScale(tick))
          .attr('x2', xScale(tick))
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .attr('stroke', '#666')
          .attr('stroke-width', 1)
          .attr('opacity', 0.5);
      }
    });

    // Add horizontal grid lines (y-axis)
    data.categories.forEach((category, i) => {
      const yPos = yScale(category) + yScale.bandwidth();
      if (i < data.categories.length - 1) { // Don't draw line after the last category
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', yPos)
          .attr('y2', yPos)
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', 1)
          .attr('opacity', 0.3);
      }
    });

    // Left bars (negative direction)
    g.selectAll('.left-bar')
      .data(data.leftData)
      .enter().append('rect')
      .attr('class', 'left-bar')
      .attr('x', d => xScale(-Math.abs(d.value)))
      .attr('y', d => yScale(d.category))
      .attr('width', d => xScale(0) - xScale(-Math.abs(d.value)))
      .attr('height', yScale.bandwidth())
        .attr('fill', d => d.category === selectedCategory ? '#b91c1c' : '#ef4444')
      .attr('opacity', d => d.category === selectedCategory ? 1 : 0.8)
      .attr('rx', 4)
      .style('cursor', onCategoryClick ? 'pointer' : 'default')
      .on('click', function(event, d) {
        if (onCategoryClick) {
          onCategoryClick(d.category);
        }
      })
      .on('mouseover', function(event, d) {
        if (onCategoryClick) {
          d3.select(this)
            .attr('opacity', 1)
              .attr('fill', d.category === selectedCategory ? '#b91c1c' : '#dc2626');
        }
      })
      .on('mouseout', function(event, d) {
        if (onCategoryClick) {
          d3.select(this)
            .attr('opacity', d.category === selectedCategory ? 1 : 0.8)
              .attr('fill', d.category === selectedCategory ? '#b91c1c' : '#ef4444');
        }
      });

    // Right bars (positive direction)
    g.selectAll('.right-bar')
      .data(data.rightData)
      .enter().append('rect')
      .attr('class', 'right-bar')
      .attr('x', xScale(0))
      .attr('y', d => yScale(d.category))
      .attr('width', d => xScale(d.value) - xScale(0))
      .attr('height', yScale.bandwidth())
        .attr('fill', d => d.category === selectedCategory ? '#1d4ed8' : '#3b82f6')
      .attr('opacity', d => d.category === selectedCategory ? 1 : 0.8)
      .attr('rx', 4)
      .style('cursor', onCategoryClick ? 'pointer' : 'default')
      .on('click', function(event, d) {
        if (onCategoryClick) {
          onCategoryClick(d.category);
        }
      })
      .on('mouseover', function(event, d) {
        if (onCategoryClick) {
          d3.select(this)
            .attr('opacity', 1)
              .attr('fill', d.category === selectedCategory ? '#1d4ed8' : '#2563eb');
        }
      })
      .on('mouseout', function(event, d) {
        if (onCategoryClick) {
          d3.select(this)
            .attr('opacity', d.category === selectedCategory ? 1 : 0.8)
              .attr('fill', d.category === selectedCategory ? '#1d4ed8' : '#3b82f6');
        }
      });

    // Add value labels on left bars
    g.selectAll('.left-label')
      .data(data.leftData)
      .enter().append('text')
      .attr('class', 'left-label')
      .attr('x', d => xScale(-Math.abs(d.value)) - 5)
      .attr('y', d => yScale(d.category) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
        .style('fill', '#ef4444')
      .style('font-weight', 'bold')
      .text(d => Math.abs(d.value));

    // Add value labels on right bars
    g.selectAll('.right-label')
      .data(data.rightData)
      .enter().append('text')
      .attr('class', 'right-label')
      .attr('x', d => xScale(d.value) + 5)
      .attr('y', d => yScale(d.category) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
        .style('fill', '#3b82f6')
      .style('font-weight', 'bold')
      .text(d => d.value);

    // Add category labels (y-axis)
    g.selectAll('.category-label')
      .data(data.categories)
      .enter().append('text')
      .attr('class', 'category-label')
      .attr('x',-20)
      .attr('y', d => yScale(d) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '13px')
      .style('font-weight', d => d === selectedCategory ? 'bold' : '500')
      .style('fill', d => d === selectedCategory ? '#1d4ed8' : '#333')
      .style('cursor', onCategoryClick ? 'pointer' : 'default')
      .text(d => d)
      .call(wrap, 230)
      .on('click', function(event, d) {
        if (onCategoryClick) {
          onCategoryClick(d);
        }
      })
      .on('mouseover', function(event, d) {
        if (onCategoryClick) {
          d3.select(this)
            .style('fill', '#1d4ed8')
            .style('font-weight', 'bold');
        }
      })
      .on('mouseout', function(event, d) {
        if (onCategoryClick) {
          d3.select(this)
            .style('fill', d === selectedCategory ? '#1d4ed8' : '#333')
            .style('font-weight', d === selectedCategory ? 'bold' : '500');
        }
      });

    // Add x-axis (bottom)
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => Math.abs(d))
      .ticks(6);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '11px')
            .style('color', '#666');


    // Add axis labels
    g.append('text')
      .attr('x', innerWidth / 4)
      .attr('y', innerHeight + 45)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#ef4444')
      .text(data.leftLabel || 'Class Average');

    g.append('text')
      .attr('x', (3 * innerWidth) / 4)
      .attr('y', innerHeight + 45)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#3b82f6')
      .text(data.rightLabel || 'Your Interactions');

    // Add title
    g.append('text')
      .attr('x', -100)
      
      .attr('y', -20)
      .attr('text-anchor', 'left')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(data.title || 'Number of Interactions Overall by Topic');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth + 30}, -40)`);

    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#ef4444')
      .attr('opacity', 0.8)
      .attr('rx', 2);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text(data.leftLabel || 'Left')
      .style('font-size', '12px')
      .style('fill', '#333');

    legend.append('rect')
      .attr('y', 25)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.8)
      .attr('rx', 2);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 37)
      .text(data.rightLabel || 'Right')
      .style('font-size', '12px')
      .style('fill', '#333');
    

    // Add hover interactions
    g.selectAll('.left-bar, .right-bar')
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

  }, [data, width, height, onCategoryClick, selectedCategory]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default ReflectiveBarChart;

/*
USAGE GUIDE:
============

To use this ReflectiveBarChart component, pass data in the following format:

const chartData = {
  categories: ['Math', 'Science', 'English', 'History', 'Art'],
  leftData: [
    { category: 'Math', value: 85 },
    { category: 'Science', value: 78 },
    { category: 'English', value: 92 },
    { category: 'History', value: 76 },
    { category: 'Art', value: 88 }
  ],
  rightData: [
    { category: 'Math', value: 75 },
    { category: 'Science', value: 82 },
    { category: 'English', value: 79 },
    { category: 'History', value: 84 },
    { category: 'Art', value: 71 }
  ],
  leftLabel: 'Individual Score',
  rightLabel: 'Class Average',
  title: 'Performance Comparison'
};

<ReflectiveBarChart data={chartData} width={700} height={500} />

DATA STRUCTURE EXPLANATION:
- categories: Array of category names (appears on y-axis)
- leftData: Array of objects for left-side bars (negative direction)
- rightData: Array of objects for right-side bars (positive direction)
- Each data object should have:
  - category: String (must match categories array)
  - value: Number (will be displayed as bar length)
- leftLabel: String label for left side
- rightLabel: String label for right side
- title: Chart title

FEATURES:
- Reflective/adversarial layout with center line
- Interactive hover effects
- Value labels on each bar
- Grid lines for easier reading
- Responsive to width/height props
- Automatic scaling based on max values

USE CASES:
- Student vs class average performance
- Before vs after comparisons
- Two different time periods
- Competition between teams/groups
- Any A vs B comparison data
*/