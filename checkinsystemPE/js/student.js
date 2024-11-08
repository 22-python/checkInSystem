const { createApp } = Vue;
const { ElMessage } = ElementPlus;

createApp({
  data() {
    return {
      currentView: "home", // 默认显示首页内容
      baseURL: "http://localhost:8000/",
      classId: null, // 班级 ID
      socket: null, // WebSocket 实例
      avatarUrl: "", // 初始化 avatarUrl
      student_name: "",
      gender: "",
      newMessage: "",
      messages: [],
      checkinTime: "", //签到时间
      student_id: "",
      isFirst: "",
      activityId: "",
      is_photo: false, // 是否需要拍照
      activity_type: "", // 签到类型
      showCamera: false, // 控制摄像头显示
      photoDataUrl: "", // 存储拍照的结果
      qiandaocode: "", //签到码
      checkinPhoto: "", //签到照片
      currentPassword: "", // 当前密码
      newPassword: "", // 新密码
      confirmPassword: "", // 确认新密码
    };
  },
  methods: {
    scrollToBottom() {
      // 确保容器存在并滚动到底部
      this.$nextTick(() => {
        const container = this.$refs.messageContainer;
        container.scrollTop = container.scrollHeight;
      });
    },

    // 发送消息
    sendMessage() {
      if (this.newMessage.trim() === "") {
        return;
      }
      // 通过 WebSocket 发送消息
      this.socket.send(
        JSON.stringify({
          message: this.newMessage,
        })
      );
      this.newMessage = ""; // 清空输入框
    },
    //更新头像
    uploadAvatar() {
      const formData = new FormData();
      const avatarInput = document.getElementById("avatarInput");
      if (avatarInput.files.length > 0) {
        formData.append("avatar", avatarInput.files[0]);
        // 使用 Axios 发送 POST 请求
        axios
          .post(`${this.baseURL}accounts/upload_student_avatar/`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Token ${sessionStorage.getItem("token")}`, // 添加 Token 认证
            },
          })
          .then((response) => {
            console.log("头像上传成功", response.data);
            // 更新 avatarUrl 而不是直接操作 DOM
            // this.avatarUrl = response.data.avatar_url; // 更新数据
            this.avatarUrl = `http://127.0.0.1:8000${response.data.avatar_url}`; // 更新头像 URL
          })
          .catch((error) => {
            console.error("头像上传失败", error.response.data);
            alert(error.response.data.error || "头像上传失败");
          });
      }
    },
    //修改密码
    async changePassword() {
      if (this.newPassword.length < 4) {
        alert("新密码必须至少为4位！");
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        alert("新密码和确认密码不匹配！");
        return;
      }
      try {
        const token = sessionStorage.getItem("token"); // 获取存储的 token
        console.log(token);
        // 发送修改密码请求到服务器
        const response = await axios.post(
          "http://127.0.0.1:8000/attendance/change_password/",
          {
            current_password: this.currentPassword,
            new_password: this.newPassword,
          },
          {
            headers: {
              Authorization: `Token ${token}`, // 在请求中携带 token
            },
          }
        );
        alert("密码修改成功！");
        // 清空输入框
        this.currentPassword = "";
        this.newPassword = "";
        this.confirmPassword = "";
      } catch (error) {
        console.error("修改密码失败:", error);
        alert("修改密码失败，请检查当前密码是否正确。");
      }
    },
    Format_time() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0"); // 月份补零
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    async CheckinClick(activityId) {
      try {
        this.activityId = activityId;
        const response = await axios.post(
          "http://127.0.0.1:8000/attendance/isCheckin/",
          {
            activity_id: activityId,
            student_id: this.student_id,
          }
        );
        console.log("已经签到的数据：", response.data);
        if (response.data.isFirst === "True") {
          this.currentView = response.data.isFirst;
          this.activity_type = response.data.activity_type;
          this.is_photo = response.data.is_photo;
          if (response.data.is_photo) {
            this.openCamera(); // 页面加载时根据条件判断是否开启摄像头
          }
        } else {
          const cTime = response.data.checkinTime;
          this.currentView = response.data.status;
          if (response.data.checkinPhoto) {
            this.checkinPhoto = `http://127.0.0.1:8000${response.data.checkinPhoto}`;
          } else {
            this.checkinPhoto = null; // 或其他适合的值
          }

          console.log("this.checkinPhoto", this.checkinPhoto);
          this.checkinTime = new Date(cTime).toLocaleString();
        }
      } catch (error) {
        // 处理错误响应
        console.error("错误:", error);
      }
    },

    async handleCheckinClick() {
      try {
        // 获取当前时间
        const checkinTime = new Date().toISOString();
        console.log(checkinTime);
        this.checkinTime = this.Format_time();

        // 构建请求数据
        const requestData = {
          activity_id: this.activityId,
          checkin_time: checkinTime,
          student_id: this.student_id,
          activity_type: this.activity_type,
          photoDataUrl: this.is_photo ? this.photoDataUrl : null,
        };

        // 如果签到类型为签到码，才添加签到码到请求数据中
        if (this.activity_type === "签到码") {
          requestData.qiandaocode = this.qiandaocode;
        }
        if (this.activity_type === "手势") {
          const gesturePatternArray = window.frames[0].gesturePattern || null; // 获取手势密码，若未定义则为 null
          if (gesturePatternArray) {
            const gesture_code = gesturePatternArray.join(""); // 转换为字符串
            // this.gesture_code = gesture_code;
            requestData.gesture_code = gesture_code;
            console.log("手势密码：", gesture_code);
          } else {
            this.$message.error("手势未设置");
            return;
          }
        }
        if (this.activity_type === "位置") {
          var location = JSON.parse(
            window.sessionStorage.getItem("currentLocation")
          );
          if (location) {
            console.log("获取到的 this.location :", location);
          } else {
            console.log("没有找到 this.location  数据");
          }
          requestData.location = location;
        }
        if (this.activity_type === "二维码") {
          var qrcode = JSON.parse(window.sessionStorage.getItem("qrcode"));
          if (qrcode) {
            console.log("获取到的qrcode :", qrcode);
          } else {
            console.log("没有找到qrcode数据");
          }
          requestData.qrcode = qrcode;
        }

        // 发送签到请求到服务器
        const response = await axios.post(
          "http://127.0.0.1:8000/attendance/Checkin/",
          requestData
        );
        console.log("response.data.status", response.data.status);
        // 检查后端响应的状态或消息
        if (response.data.status === "error") {
          console.error("签到失败:", response.data.message);
          alert(response.data.message); // 或者通过 alert 提示错误信息
        } else {
          // 处理成功响应
          console.log("签到状态:", response.data);
          const status = response.data.status;
          const cTime = response.data.checkinTime;
          this.currentView = status;
          this.checkinTime = new Date(cTime).toLocaleString();
        }
      } catch (error) {
        console.error("请求出错:", error);
      }
    },

    async fetchMessages() {
      try {
        // 使用 axios 发送 GET 请求来获取聊天记录
        const response = await axios.get(
          `${this.baseURL}attendance/get_chat_messages/${this.classId}/`
        );
        // 将获取到的消息列表存入组件的 data 中
        console.log("response:", response);

        this.messages = response.data.messages.map((msg) => ({
          sender: msg.sender, // 发送者
          message: msg.message, // 消息内容
          timestamp: new Date(msg.timestamp).toLocaleString(), // 格式化时间戳
          avatar: `http://127.0.0.1:8000${msg.avatar}`, // 拼接 baseURL 和 avatar
          activity_id: msg.activity_id,
        }));
        console.log("Formatted messages:", this.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },
    showContent(view) {
      this.currentView = view;
      if (view === "message") {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
      if (view === "home") {
        this.$nextTick(() => {
          this.initSignInChart();
        });
      }
    },
    fetchStudentInfo() {
      const token = sessionStorage.getItem("token"); // 获取存储的 token
      console.log("Token:", token);
      const url = this.baseURL + "attendance/student_info/";
      console.log("请求 URL:", url);
      axios
        .get(url, {
          headers: {
            Authorization: `Token ${token}`, // 在请求中携带 token
          },
        })
        .then((response) => {
          console.log("响应数据:", response.data);
          // 检查响应中是否包含 class_id
          if (response.data) {
            console.log("班级 ID:", response.data.class_id);
            this.classId = response.data.class_id; // 赋值班级 ID
            this.student_id = response.data.student_id;
            this.avatarUrl = `http://127.0.0.1:8000${response.data.avatar}`;
            this.student_name = response.data.student_name;
            this.gender = response.data.gender;
            this.connectWebSocket();
            this.fetchMessages();
          } else {
            console.error("响应中没有 class_id");
            this.error = "获取用户信息失败，未找到班级 ID"; // 设置错误信息
            ElMessage.error(this.error); // 提示用户获取数据失败
          }
          this.initSignInChart();
        })
        .catch((err) => {
          console.error("获取用户信息失败", err); // 输出完整错误信息
          this.error = "获取用户信息失败"; // 设置错误信息
          ElMessage.error(this.error); // 提示用户获取数据失败
        });
    },
    // 连接 WebSocket
    connectWebSocket() {
      const token = sessionStorage.getItem("token"); // 从本地存储中获取 token
      console.log("websocket", token);
      this.socket = new WebSocket(
        `ws://localhost:8000/ws/sign_in/${this.classId}/?token=${token}`
      );
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("获取的信息", data);

        // 使用 ElementPlus 的 Message 显示签到通知
        ElMessage({
          message: data.message,
          type: "info",
          duration: 3000,
        });
        // 设置 messages 的值
        this.messages.push({
          sender: data.username,
          message: data.message,
          timestamp: new Date().toLocaleString(), // 获取当前时间戳
          avatar: `http://127.0.0.1:8000${data.avatar}`,
          activity_id: data.activity_id,
        });
      };

      this.socket.onclose = () => {
        console.error("WebSocket closed unexpectedly");
        ElMessage.error("WebSocket 连接已关闭");
      };
    },
    // -----------------------------------------拍照------------------
    openCamera() {
      this.showCamera = true;
      this.startCamera();
    },
    startCamera() {
      this.$nextTick(() => {
        const video = this.$refs.video;
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            video.srcObject = stream;
            video.play();
          })
          .catch((err) => console.error("无法访问摄像头", err));
      });
    },
    takePhoto() {
      const video = this.$refs.video;
      const canvas = this.$refs.canvas;
      const context = canvas.getContext("2d");

      // 拍照并显示在 canvas 上
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.photoDataUrl = canvas.toDataURL("image/png");

      // 停止视频流
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    },
    retakePhoto() {
      // 重置 photoDataUrl 并重新启动摄像头
      this.photoDataUrl = "";
      this.startCamera();
    },

    initSignInChart() {
      // 获取图表容器的 DOM 元素
      const chartDom = document.getElementById("signInChart");
      // 使用 ECharts 初始化图表
      const myChart = echarts.init(chartDom);
      const url = this.baseURL + "attendance/get_checkrecord/";
      console.log("initSignInChart", this.student_id);
      // 请求后端接口获取签到数据
      axios
        .get(url, {
          params: { student_id: this.student_id }, // 使用 params 来传递查询参数
        })
        .then((response) => {
          // 获取返回的数据，假设返回的数据是一个包含 'present', 'late', 'absent' 的对象
          const data = response.data;
          // 更新图表的数据
          const option = {
            title: {
              text: "签到记录",
              left: "center",
              textStyle: { fontSize: 20 },
            },
            tooltip: {
              trigger: "item",
              formatter: "{a} <br/>{b}: {c} ({d}%)",
            },
            legend: {
              orient: "vertical",
              left: "right",
              data: ["已签到", "未签到", "迟到"],
            },
            series: [
              {
                name: "签到状态",
                type: "pie",
                radius: "50%",
                data: [
                  { value: data.present, name: "已签到" }, // 已签到的数量
                  {
                    value: data.absent,
                    name: "未签到",
                    itemStyle: { color: "#FF9800" },
                  }, // 未签到的数量
                  {
                    value: data.late,
                    name: "迟到",
                    itemStyle: { color: "#F44336" },
                  }, // 迟到的数量
                ],
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: "rgba(0, 0, 0, 0.5)",
                  },
                },
              },
            ],
          };
          // 设置图表的选项并应用
          myChart.setOption(option);
        })
        .catch((error) => {
          console.error("获取签到数据失败:", error);
        });
    },
  },

  mounted() {
    this.fetchStudentInfo(); // 在组件挂载时获取学生信息
  },
})
  .use(ElementPlus)
  .mount("#app");
