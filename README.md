# SZU Visualization

基于 d3.js 的可视化信息处理导论大作业：可交互的美国各州超市年度利润数据地图以及每月详细利润柱状图。

## 功能

-	地图用颜色来表示某个州在所有州中的相对利润表现（越绿表示表现越好，越红表示表现越差）。
-	鼠标悬停在某个州上可以查看州的州名及当前年份的总利润。
-	可通过点击某个州可以查看该州在当前年份每个月利润的柱状图。
-	可通过点击年份按钮来切换当前年份，切换时地图每个州的颜色会随其在新的年份中相对利润表现而改变；此外，某个州的每月详细利润的柱状图也会改变并伴有过渡效果。
-	可通过点击“Play all years”按钮来自动切换年份，便于观察。

## 瑕疵
- csv 文件有 1w 条数据可能会加载（白屏）很久。
- 为了赶 DDL 我也是开启了暴走模式，所以代码质量有点 🙈 2333。
