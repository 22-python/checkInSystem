let pattern = [];
let isDrawing = false;
const circles = document.querySelectorAll(".circle");
const grid = document.querySelector(".grid");
let lines = [];

// 重置图案
function resetPattern() {
  pattern = [];
  lines.forEach((line) => line.remove());
  lines = [];
  circles.forEach((circle) => circle.classList.remove("active"));
  console.log("图案已重设");
}

// 获取元素的中心坐标
function getCenter(element) {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// 画连接线
function drawLine(start, end) {
  const line = document.createElement("div");
  line.classList.add("line");
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  line.style.width = `${length}px`;
  line.style.left = `${start.x - grid.getBoundingClientRect().left}px`;
  line.style.top = `${start.y - grid.getBoundingClientRect().top}px`;
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);
  line.style.transform = `rotate(${angle}deg)`;
  grid.appendChild(line);
  lines.push(line);
}

// 检测触摸点是否在某个圆圈内
function getCircleUnderTouch(touchX, touchY) {
  for (let circle of circles) {
    const rect = circle.getBoundingClientRect();
    if (
      touchX >= rect.left &&
      touchX <= rect.right &&
      touchY >= rect.top &&
      touchY <= rect.bottom
    ) {
      return circle;
    }
  }
  return null;
}

// 触摸开始事件
grid.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  isDrawing = true;
  const circle = getCircleUnderTouch(e.clientX, e.clientY);
  if (circle && !pattern.includes(circle.getAttribute("data-index"))) {
    pattern.push(circle.getAttribute("data-index"));
    circle.classList.add("active");
  }
});

// 触摸移动事件
grid.addEventListener("pointermove", (e) => {
  if (isDrawing) {
    const touchX = e.clientX;
    const touchY = e.clientY;
    const circle = getCircleUnderTouch(touchX, touchY);
    if (circle && !pattern.includes(circle.getAttribute("data-index"))) {
      const lastCircle = document.querySelector(
        `.circle[data-index="${pattern[pattern.length - 1]}"]`
      );
      const start = getCenter(lastCircle);
      const end = getCenter(circle);
      drawLine(start, end);
      pattern.push(circle.getAttribute("data-index"));
      circle.classList.add("active");
    }
  }
});

// 触摸结束事件
grid.addEventListener("pointerup", () => {
  isDrawing = false;
  console.log("当前图案：", pattern);
});
