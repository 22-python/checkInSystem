// map.js
var map, marker;

function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

        // 初始化地图，使用当前位置作为中心
        map = new AMap.Map("map", {
          center: [longitude, latitude], // 设置地图中心为当前位置
          zoom: 15,
        });
        // 创建一个标记
        marker = new AMap.Marker({
          position: [longitude, latitude], // 初始位置
          title: "当前位置",
        });
        marker.setMap(map);
        // 确保在地图加载完成后绑定点击事件
        map.on("click", function (e) {
          var position = e.lnglat; // 获取点击位置的经纬度
          var currentLocation = { lat: position.lat, lng: position.lng }; // 更新坐标
          window.currentLocation = currentLocation; // 直接设置window.currentLocation
          // 将 currentLocation 保存到 window.name
          window.name = JSON.stringify(currentLocation);
          // 更新标记位置
          marker.setPosition(position);
          console.log("currentLocation", currentLocation); // 打印到控制台
        });
      },
      function (error) {
        document.getElementById("result").innerHTML =
          "获取位置失败: " + error.message;
      }
    );
  } else {
    document.getElementById("result").innerHTML = "浏览器不支持地理位置服务";
  }
}
