// Population data
// Population data
const populationData = {
    years: [1960, 1970, 1980, 1990, 2000, 2010, 2020, 2022],
    countries: {
        'China': [0.66, 0.82, 0.98, 1.13, 1.26, 1.34, 1.41, 1.43],
        'India': [0.45, 0.56, 0.71, 0.87, 1.06, 1.23, 1.38, 1.42],
        'United States': [0.18, 0.21, 0.23, 0.25, 0.28, 0.31, 0.33, 0.34],
        'Indonesia': [0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27, 0.28]
    }
};

// FLAG-INSPIRED COLORS
const colors = {
    'China': '#de2910',     // Chinese Red
    'India': '#004ba0',     // Indian Saffron
    'United States': '#3c3b6e', // US Navy Blue
    'Indonesia': '#ff6900'  // Indonesian Red
};

let svg, x, y, xAxis, yAxis;
let chartHeight, chartWidth;


// Initialize when page loads
document.addEventListener("DOMContentLoaded", function() {
    console.log("🚀 Initializing D3.js Bar Chart...");
    
    if (typeof d3 === 'undefined') {
        console.error('D3.js not loaded!');
        return;
    }
    
    initializeChart();
    setupEventListeners();
});

function initializeChart() {
    const margin = { top: 60, right: 80, bottom: 100, left: 80 };
    chartWidth = 1200 - margin.left - margin.right;
    chartHeight = 600 - margin.top - margin.bottom;

    // Clear existing SVG
    d3.select("#population-chart").html("");

    // Create scales
    x = d3.scaleBand()
        .domain(populationData.years.map(String))
        .range([0, chartWidth])
        .padding(0.1);

    y = d3.scaleLinear()
        .domain([0, 1.6])
        .range([chartHeight, 0]);

    // Create SVG
    svg = d3.select("#population-chart")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-chartWidth)
            .tickFormat("")
        );

    // Create axes
    xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x));

    yAxis = svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

    // Add axis labels
    svg.append("text")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 40})`)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -chartHeight / 2)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Population (Billions)");

    // Add chart title
    svg.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Population by Country and Year");

    // Create groups for bars
    svg.append("g").attr("class", "bars");

    // Create legend
    createLegend();

    // Initial chart render
    updateChart();
}

function createLegend() {
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${chartWidth - 150}, 20)`);

    Object.keys(colors).forEach((country, i) => {
        const legendItem = legend.append("g")
            .attr("transform", `translate(0, ${i * 25})`)
            .attr("class", "legend-item")
            .style("cursor", "pointer")
            .on("click", function() {
                const checkbox = document.querySelector(`input[value="${country}"]`);
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    updateChart();
                }
            });

        legendItem.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colors[country])
            .attr("rx", 3);

        legendItem.append("text")
            .attr("x", 22)
            .attr("y", 12)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(country);
    });
}

function updateChart() {
    const selectedCountries = Array.from(document.querySelectorAll('.country-selection input:checked'))
        .map(checkbox => checkbox.value);

    // Prepare data for grouped bars
    const data = [];
    populationData.years.forEach((year, yearIndex) => {
        selectedCountries.forEach(country => {
            data.push({
                year: String(year),
                country: country,
                population: populationData.countries[country][yearIndex],
                color: colors[country]
            });
        });
    });

    // Update bars with animation
    const bars = svg.select(".bars").selectAll(".bar")
        .data(data, d => `${d.country}-${d.year}`);

    // Calculate bar width based on number of selected countries
    const barWidth = x.bandwidth() / Math.max(selectedCountries.length, 1);

    // Enter new bars
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => {
            const countryIndex = selectedCountries.indexOf(d.country);
            return x(d.year) + (countryIndex * barWidth);
        })
        .attr("y", chartHeight) // Start from bottom
        .attr("width", barWidth)
        .attr("height", 0)
        .attr("fill", d => d.color)
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip)
        .on("mousemove", moveTooltip)
        .merge(bars)
        .transition()
        .duration(500)
        .attr("x", d => {
            const countryIndex = selectedCountries.indexOf(d.country);
            return x(d.year) + (countryIndex * barWidth);
        })
        .attr("y", d => y(d.population))
        .attr("width", barWidth)
        .attr("height", d => chartHeight - y(d.population))
        .attr("fill", d => d.color);

    // Exit old bars
    bars.exit()
        .transition()
        .duration(500)
        .attr("height", 0)
        .attr("y", chartHeight)
        .remove();
}

function showTooltip(event, d) {
    const tooltip = d3.select("#tooltip");
    tooltip
        .style("opacity", 1)
        .html(`
            <strong>${d.country}</strong><br>
            Year: ${d.year}<br>
            Population: <strong>${d.population.toFixed(2)} Billion</strong>
        `);
}

function moveTooltip(event) {
    d3.select("#tooltip")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
}

function hideTooltip() {
    d3.select("#tooltip").style("opacity", 0);
}

function setupEventListeners() {
    document.getElementById("selectAll").addEventListener("click", function() {
        document.querySelectorAll('.country-selection input').forEach(cb => cb.checked = true);
        updateChart();
    });

    document.getElementById("clearAll").addEventListener("click", function() {
        document.querySelectorAll('.country-selection input').forEach(cb => cb.checked = false);
        updateChart();
    });

    document.getElementById("resetView").addEventListener("click", function() {
        updateChart();
    });

    document.querySelectorAll('.country-selection input').forEach(checkbox => {
        checkbox.addEventListener("change", updateChart);
    });
}
