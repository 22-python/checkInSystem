const { createApp } = Vue;
const { ElMessage } = ElementPlus;

createApp({
  data() {
    return {
      baseURL: "http://localhost:8000/",
      currentView: "home", // 默认显示首页内容
      requirePhoto: false, // 默认值
      timing: false, // 默认值
      updatecode: false, //是否开启更新二维码
      multiClass: false, // 多班发布状态
      Specifylocal: false,
      activitytime: null,
      scheduled_time: new Date(), // 设置当前日期时间为默认值, // 定时发布的时间
      sent_time: null,
      late_duration: "5", //允许迟到时长
      selectedClasses: [], // 选中的班级，可以多选
      classList: [], // 可供选择的班级列表
      activity_type: "普通", // 跟踪选择的签到模式
      duration: "1", //持续时间
      qiandaocode: "", //签到码
      updateFrequency: "5000",
      isGenerating: false, // 控制二维码生成状态
      isModalVisible: false, // 控制模态弹窗显示
      intervalId: null, // 定时器ID
      gesture_code: null, //手势
      QRCode: "",
      avatarUrl: "", // 初始化 avatarUrl
      location: null,
      newMessage: "",
      messages: [],
      selectedClassId: 1,
      selectedStatus: "all", //签到状态
      activityId: "",
      presentStudents: [], //签到学生
      lateStudents: [], //迟到学生
      absentStudents: [], //未签到学生
      allStudents: [], // 当前展示的学生数据
      filteredStudents: [], // 根据状态过滤后的学生列表
      currentPassword: "", // 当前密码
      newPassword: "", // 新密码
      confirmPassword: "", // 确认新密码
      teacher_id: "",
      teacher_name: "",
      gender: "",
      pattern: [],
      isDrawing: false,
      lines: [],
      canDraw: true, // 控制是否可以绘制
      patternPassword: "", // 存储当前图案密码
      checkin_range: 100,
    };
  },
  methods: {
    clearData() {
      this.requirePhoto = false;
      this.timing = false;
      this.updatecode = false;
      this.multiClass = false;
      this.Specifylocal = false;
      this.activitytime = null;
      this.publishTime = null;
      this.qiandaocode = "";
      this.QRCode = "";
      this.gesture_code = null;
      this.checkin_range = null;
    },
    scrollToBottom() {
      // 确保容器存在并滚动到底部
      this.$nextTick(() => {
        const container = this.$refs.messageContainer;
        container.scrollTop = container.scrollHeight;
      });
    },
    // handleChange() {},
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
    connectWebSocket() {
      const token = sessionStorage.getItem("token"); // 从本地存储中获取 token
      this.socket = new WebSocket(
        `ws://localhost:8000/ws/sign_in/${this.selectedClassId}/?token=${token}`
      );
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("获取的信息", data);
        // 使用 ElementPlus 的 Message 显示签到通知
        // ElMessage({
        //   message: data.message,
        //   type: "info",
        //   duration: 3000,
        // });
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
    async fetchMessages() {
      try {
        this.connectWebSocket();
        // 使用 axios 发送 GET 请求来获取聊天记录
        const response = await axios.get(
          `${this.baseURL}attendance/get_chat_messages/${this.selectedClassId}/`
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
        this.scrollToBottom();
        console.log("Formatted messages:", this.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },

    uploadAvatar() {
      const formData = new FormData();
      const avatarInput = document.getElementById("avatarInput");
      if (avatarInput.files.length > 0) {
        formData.append("avatar", avatarInput.files[0]);
        // 使用 Axios 发送 POST 请求
        axios
          .post(`${this.baseURL}accounts/upload_teacher_avatar/`, formData, {
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
    fetchTeacherInfo() {
      const token = sessionStorage.getItem("token"); // 获取存储的 token
      console.log("教师Token:", token);
      const url = this.baseURL + "attendance/teacher_info/";
      console.log("请求 URL:", url);
      axios
        .get(url, {
          headers: {
            Authorization: `Token ${token}`, // 在请求中携带 token
          },
        })
        .then((response) => {
          console.log("响应数据:", response.data);
          if (response.data) {
            this.teacher_id = response.data.teacher_id;
            this.avatarUrl = `http://127.0.0.1:8000${response.data.avatar}`;
            this.teacher_name = response.data.teacher_name;
            this.gender = response.data.gender;
          } else {
            ElMessage.error(this.error); // 提示用户获取数据失败
          }
        })
        .catch((err) => {
          ElMessage.error(this.error); // 提示用户获取数据失败
        });
    },
    //获取班级名称
    fetchClass() {
      axios
        .get(`${this.baseURL}attendance/get_ClassName/`)
        .then((response) => {
          // 将响应数据中的 name 提取出来并存入 classList
          this.classList = response.data;
          console.log("班级信息：", response.data);
        })
        .catch((error) => {
          console.error("Error fetching class names:", error);
        });
    }, //修改密码
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

    showContent(view) {
      this.currentView = view;
      if (view == "message") {
        this.scrollToBottom();
      }
    },

    handleSubmit(event) {
      event.preventDefault(); // 阻止默认提交行为
      if (this.selectedClasses.length === 0) {
        this.$message.error("请至少选择一个班级！");
        return;
      }
      // 首先检查签到类型是否为签到码
      if (this.activity_type == "签到码") {
        // 将签到码转换为字符串
        const codeStr = this.qiandaocode ? this.qiandaocode.toString() : "";
        console.log("codeStr", codeStr.length);
        if (codeStr.length < 5) {
          this.$message.error("签到码必须大于4位且只能为数字。");
          return;
        }
      }
      if (this.activity_type == "手势") {
        const gesturePatternArray = window.frames[0].gesturePattern || null; // 获取手势密码，若未定义则为 null
        if (gesturePatternArray) {
          const gesture_code = gesturePatternArray.join(""); // 转换为字符串
          this.gesture_code = gesture_code;
          console.log("手势密码：", gesture_code);
        } else {
          this.$message.error("手势未设置");
          return;
        }
      }
      if (this.activity_type == "位置") {
        console.log("点击了位置");
        this.location = JSON.parse(
          window.sessionStorage.getItem("currentLocation")
        );
        if (this.location) {
          this.location = this.location.lat + "_" + this.location.lng;
          console.log("获取到的 this.location :", this.location);
        } else {
          console.log("没有找到 this.location  数据");
        }
      }

      // 检查签到类型是否为二维码
      if (this.activity_type === "二维码") {
        this.startGenerating().then(() => {
          console.log("QRCode:", this.QRCode); // 此时 this.QRCode 不为空
          this.submitForm(); // 等待 QRCode 生成后再调用表单提交方法
        });
      } else {
        this.submitForm(); // 非二维码签到类型，直接提交
      }
    },

    // 提交表单数据的方法
    submitForm() {
      this.sent_time = new Date().toISOString(); // 获取当前时间
      // 收集表单数据
      const formData = {
        activity_type: this.activity_type, //签到类型
        duration: this.duration, // 活动时长
        requirePhoto: this.requirePhoto, //是否需要拍照
        scheduled_time: this.scheduled_time, //定时发放时间
        selectedClasses: this.selectedClasses,
        qiandaocode: this.qiandaocode,
        updateFrequency: this.updateFrequency, //更新频率
        updatecode: this.updatecode, //是否更新
        late_duration: this.late_duration, //允许迟到时间
        gesture_code: this.gesture_code, //手势码
        checkin_range: this.checkin_range, //签到范围
        location: this.location, //地点
        sent_time: this.sent_time, //发布签到时间
        qr_code: this.QRCode, // 将生成的 QRCode 加入表单数据
      };
      // 打印表单数据查看
      console.log("表单数据:", formData);

      // 使用 axios 提交表单数据到服务器
      const token = sessionStorage.getItem("token"); // 获取存储的 token
      if (!token) {
        console.error("Token 不存在，用户未登录或认证失败。");
        return;
      }
      axios
        .post(this.baseURL + "attendance/publish_and_send_checkin/", formData, {
          headers: {
            Authorization: `Token ${token}`, // 在请求中携带 token
          },
        })
        .then((response) => {
          console.log("签到发送成功:", response.data);
          this.clearData();
          this.$message.success("签到发送成功!"); // 显示成功提示
          this.showContent(this.activity_type === "二维码" ? "QRcode" : "home");
        })
        .catch((error) => {
          if (error.response && error.response.status === 401) {
            console.error("401 未授权 - 检查 Token 是否有效或已过期");
            this.$message.error("未授权 - 检查 Token 是否有效或已过期");
          } else {
            console.error("签到失败:", error);
            this.$message.error("签到失败，请重试。");
          }
        });
    },
    //查看签到状态
    handleCheckinClick(activityId) {
      console.log(activityId);
      this.activityId = activityId;
      this.currentView = "check_details";
      this.getStudentsByStatus();
    },
    processPhotoUrl(originalUrl) {
      return originalUrl ? `http://127.0.0.1:8000${originalUrl}` : null;
    },
    changeclass() {
      this.selectedStatus = "all"; //签到状态
      this.getStudentsByStatus();
    },
    changestatus() {
      console.log("成功", this.presentStudents);
      console.log("迟到", this.lateStudents);
      console.log(this.absentStudents);
      console.log("切换状态");
      this.filterStudents();
    },
    // 获取学生签到信息
    getStudentsByStatus() {
      this.loading = true; // 设置加载状态
      const token = sessionStorage.getItem("token"); // 获取存储的 token
      axios
        .get(this.baseURL + "attendance/getStudentsByStatus/", {
          params: {
            selectedClassId: this.selectedClassId,
            activityId: this.activityId,
          },
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
            this.allStudents = response.data.students.all; // 未签到
            // 初始化显示所有学生
            this.filteredStudents = this.allStudents;
          } else {
            ElMessage.warning("你并未在此班级发布签到"); // 提示无学生信息
            this.presentStudents = response.data.students.present; // 已签到
            this.lateStudents = response.data.students.late; // 迟到
            this.absentStudents = response.data.students.absent; // 未签到
            this.allStudents = response.data.students.all; // 未签到
            this.filteredStudents = this.allStudents;
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
    // 过滤学生列表
    filterStudents() {
      switch (this.selectedStatus) {
        case "present":
          this.filteredStudents = this.presentStudents;
          break;
        case "late":
          this.filteredStudents = this.lateStudents;
          break;
        case "absent":
          this.filteredStudents = this.absentStudents;
          break;
        case "all":
        default:
          this.filteredStudents = this.allStudents;
          break;
      }
    },
    // --------------------------------------------------------------二维码----------------------------------------------
    generateRandomString(length) {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      // let result = new Date().toISOString();
      let result = "";
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
      }
      return result;
    },
    generateQRCode(text) {
      // 确保 $refs.qrcode 是存在的
      const qrCodeContainer = this.$refs.qrcode;
      if (qrCodeContainer) {
        // 清除之前的二维码，防止重复显示
        qrCodeContainer.innerHTML = ""; // 使用 $refs 获取元素
        // 创建新的二维码实例并生成
        const qrCode = new QRCode(qrCodeContainer, {
          text: text,
          width: 256, // 二维码宽度
          height: 256, // 二维码高度
          colorDark: "#000000", // 二维码颜色
          colorLight: "#ffffff", // 背景颜色
          correctLevel: QRCode.CorrectLevel.H, // 纠错级别
        });
      } else {
        console.error("二维码容器未找到");
      }
    },

    showModal() {
      this.isModalVisible = true; // 显示模态弹窗
    },
    closeModal() {
      this.isModalVisible = false; // 隐藏模态弹窗
      this.isGenerating = false; // 点击结束后停止二维码生成
      this.showContent("home");
    },

    // 开始生成二维码
    async startGenerating() {
      this.isGenerating = true;
      this.showModal(); // 显示模态弹窗

      // 使用 Promise 确保生成完 QRCode 再返回
      return new Promise((resolve) => {
        this.$nextTick(() => {
          this.QRCode = this.generateRandomString(10); // 生成二维码字符串
          this.generateQRCode(this.QRCode); // 立即生成二维码
          resolve(); // 确保 QRCode 已生成后才返回
        });
      });
    },

    // startGenerating() {
    //   this.isGenerating = true;
    //   this.showModal(); // 显示模态弹窗
    //   // if (this.updatecode) {
    //   //   const intervalId = setInterval(() => {
    //   //     if (this.isGenerating) {
    //   //       const randomString = this.generateRandomString(10); // 生成10位随机字符串
    //   //       console.log("生成随机字符串:", randomString);
    //   //       this.generateQRCode(randomString); // 使用随机字符串生成二维码
    //   //     } else {
    //   //       clearInterval(intervalId); // 停止定时器
    //   //     }
    //   //   }, this.updateFrequency);
    //   // }
    //   // 页面加载后立即生成第一个二维码
    //   this.$nextTick(() => {
    //     this.QRCode = this.generateRandomString(10); // 将 QRCode 保存到组件实例中
    //     this.generateQRCode(this.QRCode); // 立即生成一个随机二维码
    //   });
    // },
    // --------------------------------------------------------------二维码----------------------------------------------
  },
  mounted() {},
  created() {
    this.fetchClass(); // 在组件创建时调用 fetchClass 方法
    this.fetchMessages();
    this.fetchTeacherInfo();
  },
})
  .use(ElementPlus)
  .mount("#app");
