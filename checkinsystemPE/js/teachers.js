const { createApp } = Vue;
const { ElMessage } = ElementPlus;

createApp({
  data() {
    return {
      presentStudents: [], //签到学生
      lateStudents: [], //迟到学生
      absentStudents: [], //未签到学生
      currentStudents: [], // 当前展示的学生数据
      teacherId: "",
      userData: null, // 用户数据
      error: null, // 错误信息
      baseURl: "http://localhost:8000/",
      loading: false, // 加载状态
      checkmessage: {
        activity_type: "签到码",
        duration: "10",
        scheduled_time: null, // 定时发放的时间
        late_duration: "10", //允许迟到时长
        classes: ["计算机科学1班", "计算机科学2班"], // 班级的数组
        isPhoto: false,
        gesture_code: null,
        location: null,
        isUpdate: false,
        update_frequency: null,
        checkin_code: "12345",
      },
    };
  },
  methods: {
    showPresent() {
      this.currentStudents = this.presentStudents; // 切换到已签到学生数据
    },
    // publish() {
    //   console.log("发送签到");
    //   this.publish_Checkin();
    // },
    showLate() {
      this.currentStudents = this.lateStudents; // 切换到迟到学生数据
    },
    showAbsent() {
      this.currentStudents = this.absentStudents; // 切换到未签到学生数据
    },
    // 获取学生签到信息
    getStudentsByStatus() {
      this.loading = true; // 设置加载状态
      const token = localStorage.getItem("token"); // 获取存储的 token
      axios
        .get(this.baseURl + "attendance/getStudentsByStatus/", {
          headers: {
            Authorization: `Token ${token}`, // 在请求中携带 token
          },
        })
        .then((response) => {
          this.loading = false; // 取消加载状态
          if (response.data.code === 1) {
            console.log(response.data);
            this.presentStudents = response.data.students.present; // 已签到
            this.lateStudents = response.data.students.late; // 迟到
            this.absentStudents = response.data.students.absent; // 未签到
          } else {
            ElMessage.warning("未找到任何学生信息"); // 提示无学生信息
          }
        })
        .catch((err) => {
          this.loading = false; // 取消加载状态
          console.error(err);
          // 根据错误类型提供不同的提示
          if (err.response) {
            // 请求已发出，服务器以状态代码响应
            ElMessage.error(
              `获取签到学生信息失败: ${err.response.data.message || "未知错误"}`
            ); // 提示用户获取数据失败
          } else if (err.request) {
            // 请求已发出，但没有响应
            ElMessage.error("未收到响应，请检查网络连接");
          } else {
            // 其他错误
            ElMessage.error(`请求出错: ${err.message}`);
          }
        });
    },

    fetchUserData() {
      this.loading = true; // 设置加载状态
      this.error = null; // 清除之前的错误信息
      const token = localStorage.getItem("token"); // 获取存储的 token
      axios
        .get(this.baseURl + "accounts/get_user_data/", {
          headers: {
            Authorization: `Token ${token}`, // 在请求中携带 token
          },
        })
        .then((response) => {
          console.log("数据:", response);
          this.loading = false; // 取消加载状态
          if (response.data.status === "success") {
            this.userData = response.data.data; // 设置用户数据
          } else {
            // ElMessage.warning(response.data.message); // 显示警告信息
          }
        })
        .catch((err) => {
          this.loading = false; // 取消加载状态
          console.error(err);
          this.error = "获取用户信息失败"; // 设置错误信息
          ElMessage.error(this.error); // 提示用户获取数据失败
        });
    },
    // 发送签到
    publish_Checkin() {
      const token = localStorage.getItem("token"); // 获取存储的 token
      console.log(token);
      if (!token) {
        console.error("Token 不存在，用户未登录或认证失败。");
        return;
      }
      axios
        .post(this.baseURl + "attendance/publish_checkin/", this.checkmessage, {
          headers: {
            Authorization: `Token ${token}`, // 在请求中携带 token
          },
        })
        .then((response) => {
          // 处理成功响应
          console.log("签到发送成功:", response.data);
          this.connectWebSocket(this.checkmessage.classes); // 发送签到后连接 WebSocket
        })
        .catch((error) => {
          // 处理错误
          if (error.response && error.response.status === 401) {
            console.error("401 未授权 - 检查 Token 是否有效或已过期");
          } else {
            console.error("签到失败:", error);
          }
        });
    },
    connectWebSocket(classId) {
      this.socket = new WebSocket(`ws://localhost:8000/ws/class/${classId}/`);

      this.socket.onopen = () => {
        console.log("WebSocket连接已建立");
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const message = data.message;
        document.getElementById("status-output").textContent += message + "\n";
      };

      this.socket.onclose = (event) => {
        console.log("WebSocket连接已关闭:", event);
      };
    },
  },
  mounted() {
    this.getStudentsByStatus(); // 组件挂载后调用获取签到学生信息的方法
    this.fetchStudentInfo();
    // this.publish_Checkin();
    // this.connectWebSocket(2);
  },
})
  .use(ElementPlus)
  .mount("#app");
