// 模拟不同班级的签到数据
const classData = {
  class1: { pie: [60, 30, 10], bar: [60, 40, 50], trend: [10, 20, 40, 50, 60] },
  class2: { pie: [50, 35, 15], bar: [50, 30, 40], trend: [20, 30, 50, 60, 70] },
  class3: { pie: [70, 20, 10], bar: [70, 60, 80], trend: [15, 25, 55, 65, 75] },
};

let currentClass = "class1";

// 初始化图表
function updateCharts() {
  const pieData = classData[currentClass].pie;
  const barData = classData[currentClass].bar;
  const trendData = classData[currentClass].trend;

  // 更新圆形图
  pieChart.data.datasets[0].data = pieData;
  pieChart.update();

  // 更新柱状图
  barChart.data.datasets[0].data = barData;
  barChart.update();

  // 更新折线图
  lineChart.data.datasets[0].data = trendData;
  lineChart.update();
}

// 圆形占比图
const pieCtx = document.getElementById("pieChart").getContext("2d");
const pieChart = new Chart(pieCtx, {
  type: "pie",
  data: {
    labels: ["班级 1", "班级 2", "班级 3"],
    datasets: [
      {
        label: "签到人数占比",
        data: classData[currentClass].pie,
        backgroundColor: ["#2ecc71", "#3498db", "#e74c3c"],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  },
});

// 柱状图
const barCtx = document.getElementById("barChart").getContext("2d");
const barChart = new Chart(barCtx, {
  type: "bar",
  data: {
    labels: ["班级 1", "班级 2", "班级 3"],
    datasets: [
      {
        label: "签到人数",
        data: classData[currentClass].bar,
        backgroundColor: "#3498db",
        borderColor: "#2980b9",
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

// 签到趋势折线图
const lineCtx = document.getElementById("lineChart").getContext("2d");
const lineChart = new Chart(lineCtx, {
  type: "line",
  data: {
    labels: ["周一", "周二", "周三", "周四", "周五"],
    datasets: [
      {
        label: "签到趋势",
        data: classData[currentClass].trend,
        backgroundColor: "rgba(52, 152, 219, 0.5)",
        borderColor: "#3498db",
        borderWidth: 2,
        fill: true,
      },
    ],
  },
});

// 监听班级选择器变化
document.getElementById("classSelect").addEventListener("change", function () {
  currentClass = this.value;
  updateCharts();
});

// 初始化图表
updateCharts();
