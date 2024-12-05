const colors = {
    "LLaMA-3.1": "#ff7f00",
    "Claude": "#984ea3",
    "PaLM-2": "#4daf4a",
    "Gemini": "#377eb8",
    "GPT-4": "#e41a1c"
};
document.getElementById("fileInput").addEventListener("change", handleFileUpload);
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const data = d3.csvParse(content);
        createStreamgraph(data);
    };
    reader.readAsText(file);
}
function createStreamgraph(data) {
    data.forEach(d => {
        d.date = new Date(d.Date);
        d["GPT-4"] = +d["GPT-4"];
        d["Gemini"] = +d["Gemini"];
        d["PaLM-2"] = +d["PaLM-2"];
        d["Claude"] = +d["Claude"];
        d["LLaMA-3.1"] = +d["LLaMA-3.1"];
    });
    const stack = d3.stack()
        .keys(Object.keys(colors))
        .offset(d3.stackOffsetWiggle);
    const layers = stack(data);
    const svg = d3.select("#streamgraph")
        .attr("width", 900)
        .attr("height", 500);
    svg.selectAll("*").remove();
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain([d3.min(layers, layer => d3.min(layer, d => d[0])), d3.max(layers, layer => d3.max(layer, d => d[1]))])
        .range([height, 0]);
    const area = d3.area()
        .x(d => x(d.data.date))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));
    g.selectAll("path")
        .data(layers)
        .enter().append("path")
        .attr("d", area)
        .attr("fill", d => colors[d.key])
        .on("mouseover", showTooltip)
        .on("mousemove", showTooltip)
        .on("mouseout", hideTooltip);
    const xAxis = d3.axisBottom(x)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b"));
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);
    const yAxis = d3.axisLeft(y).ticks(5);
    g.append("g")
        .call(yAxis);
    const legend = d3.select("#legend");
    legend.selectAll("*").remove(); 
    Object.keys(colors).forEach(key => {
        const item = legend.append("div")
            .attr("class", "legend-item")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-bottom", "5px");
        item.append("div")
            .style("background-color", colors[key])
            .style("width", "20px")
            .style("height", "20px")
            .style("margin-right", "5px");
        item.append("span")
            .text(key);
    });
    legend.style("display", "block")
          .style("position", "absolute")
          .style("top", "50px")
          .style("left", "950px"); 
    const tooltip = d3.select("#tooltip");
    const miniSvg = d3.select("#miniChart");
    function showTooltip(event, layer) {
        const [mouseX, mouseY] = d3.pointer(event);
        const tooltipWidth = 220;
        const tooltipHeight = 180;
        const layerKey = layer.key;
        const xDate = x.invert(mouseX); 
        const closestData = layer.reduce((a, b) => Math.abs(b.data.date - xDate) < Math.abs(a.data.date - xDate) ? b : a);
        const yValue = closestData[1] - closestData[0]; 
        tooltip.style("display", "block")
            .style("left", `${Math.min(mouseX + 20, width - tooltipWidth)}px`)
            .style("top", `${Math.max(mouseY - tooltipHeight, 20)}px`);
        miniSvg.selectAll("*").remove();
        const miniX = d3.scaleBand()
            .domain(layer.map(d => d.data.date.toLocaleDateString("default", { month: "short" })))
            .range([0, 200])
            .padding(0.1);
        const miniY = d3.scaleLinear()
            .domain([0, d3.max(layer, d => d[1] - d[0])])
            .range([150, 0]);
        miniSvg.selectAll("rect")
            .data(layer)
            .enter().append("rect")
            .attr("x", d => miniX(d.data.date.toLocaleDateString("default", { month: "short" })))
            .attr("y", d => miniY(d[1] - d[0]))
            .attr("width", miniX.bandwidth())
            .attr("height", d => 150 - miniY(d[1] - d[0]))
            .attr("fill", colors[layerKey]);
        miniSvg.append("g")
            .attr("transform", "translate(0,150)")
            .call(d3.axisBottom(miniX).tickSize(0).tickPadding(5))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
        miniSvg.append("g")
            .call(d3.axisLeft(miniY).ticks(5));
        tooltip.select(".tooltip-y-value").remove(); 
        tooltip.append("div")
            .attr("class", "tooltip-y-value")
            .style("margin-top", "10px")
            .style("font-size", "14px")
            .text(`Y-Value: ${yValue.toFixed(2)}`);
    }
    function hideTooltip() {
        tooltip.style("display", "none");
    }
}
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fileInput').style.display = 'block';
});
