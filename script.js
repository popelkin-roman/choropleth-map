const educationDataUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const countyDataUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

Promise.all([
    fetch(educationDataUrl).then(res=>res.json()), 
    fetch(countyDataUrl).then(res=>res.json())
    ])
        .then(data => drawCahrt(data))
        .catch(err => console.log(err));

const drawCahrt = (data) => {
    const educationData = data[0];
    const countyData = data[1];

    const w = 1000;
    const h = 600;
    const legendWidth = 40;
    const legendHeight = 10;
    let currentCellColor = '';

    const minBachelorShare = d3.min(educationData, d=>d.bachelorsOrHigher);
    const maxBachelorShare = d3.max(educationData, d=>d.bachelorsOrHigher);

    const color = d3
        .scaleThreshold()
        .domain(d3.range(minBachelorShare, maxBachelorShare, (maxBachelorShare - minBachelorShare) / 8))
        .range(d3.schemeGreens[9]);
    
    const scaleEducationLevel = d3.scaleLinear()
        .domain([minBachelorShare, maxBachelorShare])
        .range([0, 100]);

    const path = d3.geoPath();

    const svg = d3.select(".choroplethmap")
        .append("svg")
        .attr("width", w)
        .attr("height", h)

    svg.append('g')
        .attr('class', 'counties')
        .selectAll('path')
        .data(topojson.feature(countyData, countyData.objects.counties).features)
        .enter()
        .append('path')
        .attr('class', 'county')
        .attr('data-fips', d => d.id)
        .attr('data-education', d => {
            let result = '';
            educationData.forEach(el => {
                if (el.fips === d.id) result = el.bachelorsOrHigher
            })
            if (!result) console.log("No education data for ", d.id)
            return result;
        })
        .attr('fill', d => {
            let result = 0;
            educationData.forEach( el => {
                if (el.fips === d.id) result = el.bachelorsOrHigher
            })
            return color(result);
            
        })
        .attr('d', path)
        .on("mouseover", (e, d) => {
            currentCellColor = e.target.style.fill;
            e.target.style.fill = "#aaa";
            const tooltip = d3.select("#tooltip")
                .attr("data-education", e.target.dataset.education)
                .style("visibility", "visible")
                .style("transform", `translateX(${e.clientX}px) translateY(${e.clientY}px)`)
                .append("div")
                .text((d => {
                    let result = '';
                    educationData.forEach(el => {
                        if (el.fips === d.id) result += el.state + ", " + el.area_name;
                    })
                    if (!result) console.log("No education data for ", d.id)
                        return result;
                })(d))
                .append("div")
                    .text(e.target.dataset.education + "%")
        })
        .on("mouseout", (e) => {
            e.target.style.fill = currentCellColor;
            d3.select("#tooltip")
                .style("visibility", "hidden")
                .text("");
            
        });

    const tooltip = d3.select('.choroplethmap')
        .append('div')
        .attr('class', 'tooltip')
        .attr('id', 'tooltip')
        .style('visibility', 'hidden');
    
    
    const legendContainer = svg
    .append('g')
    .attr('id', 'legend')
    .attr("transform", `translate(${w/2},0)`);

    legendContainer.selectAll('rect')
                .data(d3.range(minBachelorShare, maxBachelorShare, (maxBachelorShare - minBachelorShare) / 8))
                .enter()
                .append('rect')
                .attr('x', (d,i)=>i * legendWidth)
                .attr('width', legendWidth)
                .attr('height', legendHeight)
                .style("fill", d => color(d))

    const legendXAxis = d3
        .axisBottom(
            d3.scaleLinear()
                .domain([minBachelorShare, maxBachelorShare])
                .range([0, 8*legendWidth]))
        .tickSize(5)
        .tickFormat( (x) =>  Math.round(x) + '%')
        .tickValues(color.domain());

    const legendXAxisLine = svg.append("g")
        .attr("id", "legend-x-axis")
        .attr("transform", `translate(${w/2}, ${legendHeight})`)
        .call(legendXAxis)
}