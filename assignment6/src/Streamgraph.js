import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import "./style.css";
const Streamgraph = () => {
  const [data, setData] = useState(null); 
  useEffect(() => {
    if (data) {
      createStreamgraph(data); 
    }
  }, [data]);
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      const parsedData = d3.csvParse(content);
      setData(parsedData); 
    };
    reader.readAsText(file);
  };
  const createStreamgraph = (data) => {
    data.forEach((d) => {
      d.date = new Date(d.Date);
      Object.keys(d)
        .filter((key) => key !== "Date")
        .forEach((key) => {
          d[key] = +d[key];
        });
    });
    const colors = {
      "LLaMA-3.1": "#ff7f00",
      "Claude": "#984ea3",
      "PaLM-2": "#4daf4a",
      "Gemini": "#377eb8",
      "GPT-4": "#e41a1c",
    };
    const stack = d3.stack().keys(Object.keys(colors)).offset(d3.stackOffsetWiggle);
    const layers = stack(data);
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    const svg = d3
      .select("#streamgraph")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
    svg.selectAll("*").remove(); // Clear previous content
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(layers, (layer) => d3.min(layer, (d) => d[0])),
        d3.max(layers, (layer) => d3.max(layer, (d) => d[1])),
      ])
      .range([height, 0]);
    const area = d3
      .area()
      .x((d) => x(d.data.date))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("display", "none")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none");
    const miniChartSvg = tooltip
      .append("svg")
      .attr("id", "miniChart")
      .attr("width", 200)
      .attr("height", 150);
    g.selectAll("path")
      .data(layers)
      .enter()
      .append("path")
      .attr("d", area)
      .attr("fill", (d) => colors[d.key])
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block");
        updateMiniChart(d, d.key);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });
    const xAxis = d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));
    g.append("g").attr("transform", `translate(0,${height})`).call(xAxis);
    const yAxis = d3.axisLeft(y).ticks(5);
    g.append("g").call(yAxis);
    const legend = d3.select("#legend");
    legend.selectAll("*").remove();
    Object.keys(colors).forEach((key) => {
      const item = legend
        .append("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "5px");
      item
        .append("div")
        .style("background-color", colors[key])
        .style("width", "20px")
        .style("height", "20px")
        .style("margin-right", "5px");
      item.append("span").text(key);
    });
    const updateMiniChart = (layer, key) => {
      const chartMargin = { top: 10, right: 10, bottom: 30, left: 30 };
      const chartWidth = 200 - chartMargin.left - chartMargin.right;
      const chartHeight = 150 - chartMargin.top - chartMargin.bottom;
      miniChartSvg.selectAll("*").remove(); // Clear previous content
      const miniChartG = miniChartSvg
        .append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);
      const xMini = d3
        .scaleBand()
        .domain(data.map((d) => d.date))
        .range([0, chartWidth])
        .padding(0.1);
      const yMini = d3
        .scaleLinear()
        .domain([0, d3.max(layer, (d) => d[1] - d[0])])
        .range([chartHeight, 0]);
      miniChartG
        .selectAll(".bar")
        .data(layer)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => xMini(d.data.date))
        .attr("y", (d) => yMini(d[1] - d[0]))
        .attr("width", xMini.bandwidth())
        .attr("height", (d) => chartHeight - yMini(d[1] - d[0]))
        .attr("fill", colors[key]);
      const xAxisMini = d3.axisBottom(xMini).tickFormat(d3.timeFormat("%b"));
      miniChartG
        .append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(xAxisMini);
      const yAxisMini = d3.axisLeft(yMini).ticks(5);
      miniChartG.append("g").call(yAxisMini);
    };
  };
  return (
    <div>
      <div className="upload-section">
        <h2>Upload CSV File to Generate Streamgraph</h2>
        <input type="file" id="fileInput" accept=".csv" onChange={handleFileUpload} />
      </div>
      <div id="legend" className="legend-container"></div>
      {data && (
        <div id="streamgraph-container">
          <svg id="streamgraph"></svg>
        </div>
      )}
    </div>
  );
};
export default Streamgraph;


