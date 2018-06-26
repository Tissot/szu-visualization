'use strict';

let currentYear = 2012;
let currentState = 'Alabama';
const buttonYears = [2012, 2013, 2014, 2015];

/**
  * 初始化柱状图。
**/
// 定义svg边距规范
var margin = {top: 30, right: 0, bottom: 0, left: 100};   
var rectWidth = 500 - margin.left - margin.right,
    rectHeight = 450 - margin.top - margin.bottom;

// 定义比例尺和坐标轴，注意比例尺中与数据有关的部分是domain()，所以domain()要写在导入数据部分
var x = d3.scaleLinear()
    .range([0, rectWidth]);

var y = d3.scaleBand()
    .rangeRound([0, rectHeight])
    .paddingInner(0.2)
    .paddingOuter(0);

var xAxis = d3.axisTop()
    .scale(x)
    .ticks(5);

var yAxis = d3.axisLeft()
    .scale(y);
/*
  {
    stateName: {
      year: {
        total: number,
        monthly: [
          number,
          number,
          ...
        ]
      },
      ...
    },
    ...
  }
*/
const handledData = {};

// 读入 CSV 利润数据
d3.csv('./data/superstore-subset.csv', data => {
  // 预处理数据
  data.forEach(d => {
    const state = d.State;
    const date = d['Order Date'].split('/');
    const year = date[0];
    const month = Number(date[1]);
    const profit = Number(d.Profit.split(/\$|\,/).join(''));

    handledData[state] = handledData[state] || {};
    buttonYears.forEach(el => {
      handledData[state][el] = handledData[state][el] || { total: 0, monthly: [0,0,0,0,0,0,0,0,0,0,0,0] };
    });
    handledData[state][year].total += profit;
    handledData[state][year].monthly[month - 1] += profit;
  });

  function calcMinStateTotal() {
    let min = handledData[currentState][currentYear].total;
    for (const state in handledData) {
      const currentVal = handledData[state][currentYear].total;
      currentVal < min && (min = currentVal);
    }
    return min;
  }

  function calcMaxStateTotal() {
    let max = handledData[currentState][currentYear].total;
    for (const state in handledData) {
      const currentVal = handledData[state][currentYear].total;
      currentVal > max && (max = currentVal);
    }
    return max;
  }

  /**
    * 柱形图
  **/
  let dataSelected = handledData[currentState][currentYear];
  let popData = dataSelected.monthly;

  x.domain([d3.min(popData, el => el), d3.max(popData, el => el)]);
  y.domain(popData.map((el, index) => index + 1));

  var body = d3.select("body");

  // 使用svg边距定义svg，因为后续操作需建立在svg的基础上，虽然这里与数据无关，也要加入导入数据的部分
  var reactSvg = body.append("svg")
  .attr("width", rectWidth + margin.left + margin.right)
  .attr("height", rectHeight + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var barGroup = reactSvg.append("g")
  .attr("class", "bar");

  // 更新矩形框
  var bars = barGroup.selectAll("rect")
  .data(popData, (el, index) => index + 1)
  .enter()
  .append("rect") 
  .attr("x", 0)
  .attr("y", (el, index) => y(index + 1))
  .attr("width", el => x(el))
  .attr("height", y.bandwidth())
  .attr('fill', '#20a0ff');

  // 调用x轴
  let xA = reactSvg.append('g')
  .call(xAxis)
  .attr('class', 'axis');

  // 调用y轴
  reactSvg.append('g')
    .call(yAxis)
    .attr('class', 'axis');

  body.append("h2")
      .text(`${currentState} - ${currentYear}`);
  
  // 添加按钮标签
  var buttons = body.append("div")
    .attr("class","buttons-container")
    .selectAll("div")
    .data(buttonYears)
    .enter()
    .append("div")
    .text(function (d) {
        return d;
    })
    .attr("class",function (d) {
        if(d == currentYear){
            return "button selected"
        }
        else
            return "button";
    });
    
  let playInternal;
  
  const playAll = body.append('div')
  .attr('class', 'play-button')
  .text('Play all years.');

  playAll.on('click', () => {
    let i = 0;
    playInternal = setInterval(() => {
      update(buttonYears[i], currentState);
      ++i;
      i > buttonYears.length - 1 && clearInterval(playInternal);
    }, 800);
  });

  // 给按钮添加点击事件
  buttons.on("click", function (d) {
    update(d, currentState);
    playInternal && clearInterval(playInternal);
  });

  /**
   * 地图 
   **/
  // SVG 的宽度和高度
  const mapWidth = 1000;
  const mapHeight = 600;
  
  // 定义地图的投影
  const projection = d3.geoAlbersUsa()
  .translate([mapWidth / 2, mapHeight / 2])
  .scale([1000]);
  
  // 定义路径生成器
  const path = d3.geoPath()
  .projection(projection);
  
  // 创建 SVG 元素
  let mapSvg = d3.select('body')
  .append('svg')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr("class", "clickable");
  
  // 定义量化比例尺，将不同范围的数据映射到不同的颜色上
  const color = d3.scaleQuantize()
  .range([
    '#DD2C00',
    '#FF6D00',
    '#FFD600',
    '#64DD17',
    '#00C853'
  ]);
  
  // 设置数据的范围
  color.domain([
    calcMinStateTotal(),
    calcMaxStateTotal()
  ]);
  
  let jsonStorage;
  // 读入 GeoJSON 数据
  d3.json('./data/us-states.json', json => {
    jsonStorage = json;
    // 为每个州添加其利润值
    for(let state in handledData) {
      json.features.some(jsonFeature => {
        if (state === jsonFeature.properties.name) {
          jsonFeature.properties.value = handledData[state][currentYear].total;
          return true;
        }
        return false;
      })
    }
    
    // 绑定数据并为每一个GeoJSON feature创建一个路径
    mapSvg.selectAll('path')
    .data(json.features)
    .enter()
    .append('path')
    .attr('d', path)
    .style('fill', jsonFeature => {
      const value = jsonFeature.properties.value;
      return value ? color(value > 0 ? value : value) : '#CCC'
    })
    .on("mouseover", jsonFeature => {
      const bounds = path.bounds(jsonFeature);
      const dx = (bounds[0][0] + bounds[1][0]) / 2;
      const dy = (bounds[0][1] + bounds[1][1]) / 2;
      mapSvg.append("text")
      .attr("dx", dx - 20)
      .attr("dy", dy)
      .attr("font-size", "14px")
      .text(`${jsonFeature.properties.name}: ${jsonFeature.properties.value}`)
      .style("cursor", "default")
    })
    .on("mouseout", () => mapSvg.selectAll("text").remove())
    .on('click', jsonFeature => update(currentYear, jsonFeature.properties.name));
  });

  function update(updateYear, updateState){
    buttons.on("click", function(d) {
      currentYear = d;
      dataSelected = handledData[currentState][currentYear];
      popData = dataSelected.monthly;

      d3.select("h2")
      .text(`${currentState} - ${currentYear}`);                                         
      d3.select(".selected")
          .classed("selected", false);                                                     
                                                                                              
      d3.select(this)                                                                       
          .classed("selected", true);                                                      
                                                                                              
      x.domain([d3.min(popData, el => el), d3.max(popData, el => el)]);

      xA.remove();
      // 调用x轴
      xA = reactSvg.append('g')
        .call(xAxis)
        .attr('class', 'axis');
  
      bars = barGroup.selectAll("rect")                                                                                  
      bars.data(popData, (el, index) => index + 1)                                                              
          .transition()                                                                    
          .duration(800)   
          .ease(d3.easeLinear)                                                                
          .attr("width", el => x(el));
  
      playInternal && clearInterval(playInternal);

      // 设置数据的范围
      color.domain([
        calcMinStateTotal(),
        calcMaxStateTotal()
      ]);

      // 为每个州添加其利润值
      for(let state in handledData) {
        jsonStorage.features.some(jsonFeature => {
          if (state === jsonFeature.properties.name) {
            jsonFeature.properties.value = handledData[state][currentYear].total;
            return true;
          }
          return false;
        })
      }
      
      // 绑定数据并为每一个GeoJSON feature创建一个路径
      mapSvg.remove();

      mapSvg = d3.select('body')
      .append('svg')
      .attr('width', mapWidth)
      .attr('height', mapHeight)
      .attr("class", "clickable");

      mapSvg.selectAll('path')
      .data(jsonStorage.features)
      .enter()
      .append('path')
      .attr('d', path)
      .style('fill', jsonFeature => {
        const value = jsonFeature.properties.value;
        return value ? color(value > 0 ? value : value) : '#CCC'
      })
      .on("mouseover", jsonFeature => {
        const bounds = path.bounds(jsonFeature);
        const dx = (bounds[0][0] + bounds[1][0]) / 2;
        const dy = (bounds[0][1] + bounds[1][1]) / 2;
        mapSvg.append("text")
        .attr("dx", dx - 20)
        .attr("dy", dy)
        .attr("font-size", "14px")
        .text(`${jsonFeature.properties.name}: ${jsonFeature.properties.value}`)
        .style("cursor", "default")
      })
      .on("mouseout", () => mapSvg.selectAll("text").remove())
      .on('click', jsonFeature => update(currentYear, jsonFeature.properties.name));
    });

    currentYear = updateYear;
    currentState = updateState;
    dataSelected = handledData[currentState][currentYear];
    popData = dataSelected.monthly;
  
    //这里在标题中更新对应的年份
    d3.select("h2")
    .text(`${currentState} - ${currentYear}`);
  
    // 这里对其他标签样式进行改变
    d3.select(".selected")
      .classed("selected",false);
    // 注意筛选出当前点击按钮所代表的年份，利用好buttons.filter（）方法和传入的参数currentYear
    buttons.filter(d => d === currentYear)
          .classed("selected", true);
          
    // 更新X轴
    xA.remove();
    x.domain([d3.min(popData, el => el), d3.max(popData, el => el)]);

    // 调用x轴
    xA = reactSvg.append('g')
      .call(xAxis)
      .attr('class', 'axis');

    // 更新矩形框（在这里添加你的更新代码）
    bars = barGroup.selectAll("rect")
      .data(popData, (el, index) => index + 1)
      .transition()                                                                    
      .duration(800)   
      .ease(d3.easeLinear)
      .attr("width", el => x(el))

    // 刷新地图
    // 设置数据的范围
    color.domain([
      calcMinStateTotal(),
      calcMaxStateTotal()
    ]);

    // 为每个州添加其利润值
    for(let state in handledData) {
      jsonStorage.features.some(jsonFeature => {
        if (state === jsonFeature.properties.name) {
          jsonFeature.properties.value = handledData[state][currentYear].total;
          return true;
        }
        return false;
      })
    }
    
    // 绑定数据并为每一个GeoJSON feature创建一个路径
    mapSvg.remove();

    mapSvg = d3.select('body')
    .append('svg')
    .attr('width', mapWidth)
    .attr('height', mapHeight)
    .attr("class", "clickable");

    mapSvg.selectAll('path')
    .data(jsonStorage.features)
    .enter()
    .append('path')
    .attr('d', path)
    .style('fill', jsonFeature => {
      const value = jsonFeature.properties.value;
      return value ? color(value > 0 ? value : value) : '#CCC'
    })
    .on("mouseover", jsonFeature => {
      const bounds = path.bounds(jsonFeature);
      const dx = (bounds[0][0] + bounds[1][0]) / 2;
      const dy = (bounds[0][1] + bounds[1][1]) / 2;
      mapSvg.append("text")
      .attr("dx", dx - 20)
      .attr("dy", dy)
      .attr("font-size", "14px")
      .text(`${jsonFeature.properties.name}: ${jsonFeature.properties.value}`)
      .style("cursor", "default")
    })
    .on("mouseout", () => mapSvg.selectAll("text").remove())
    .on('click', jsonFeature => update(currentYear, jsonFeature.properties.name));
  }
});
