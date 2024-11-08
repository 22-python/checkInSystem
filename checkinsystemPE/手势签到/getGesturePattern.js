// getGesturePattern.js

// 检查是否已经定义了手势密码
if (window.gesturePattern) {
  console.log("获取的手势密码：", window.gesturePattern);
} else {
  console.log("手势密码尚未设置。");
}
