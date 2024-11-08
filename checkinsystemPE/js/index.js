const { createApp } = Vue;
const { ElMessage } = ElementPlus;

createApp({
  data() {
    return {
      currentView: "home", // 默认显示首页内容
      currentStudents: [], // 用于显示学生列表（示例数据）
      requirePhoto: false, // 默认值
      timing: false, // 默认值
      updatecode: false, //是否开启更新二维码
      multiClass: false, // 多班发布状态
      Specifylocal: false,
      activitytime: null,
      publishTime: null, // 定时发布的时间
      late_duration: "10", //允许迟到时长
      selectedClasses: [], // 选中的班级，可以多选
      classList: ["计算机科学1班", "计算机科学2班", "软件工程1班"], // 可供选择的班级列表
      selectedMode: "普通", // 跟踪选择的签到模式
      duration: "2", //持续时间
      qiandaocode: "", //签到码
      updateFrequency: "5000",
      isGenerating: false, // 控制二维码生成状态
      isModalVisible: false, // 控制模态弹窗显示
      intervalId: null, // 定时器ID
      baseURl: "http://localhost:8000/",
      gesture_code: null, //手势
      location: null,
    };
  },

  methods: {
    handleChange(option, value) {
      console.log(`选项 ${option} 状态: ${value}`);
    },
    showContent(view) {
      this.currentView = view;
      // ElMessage({ message: `切换到 ${view} 视图`, type: "success" });
    },
    handleOpen() {
      console.log("Menu opened");
    },
    handleClose() {
      console.log("Menu closed");
    },
    handleSubmit(event) {
      event.preventDefault(); // 阻止默认提交行为
      ElMessage({ message: "发布成功", type: "success" }); // 使用 ElMessage 显示提示
      if (this.selectedMode === "二维码") {
        this.showContent("QRcode");
        this.startGenerating();
      }
      // 收集表单数据
      const formData = {
        title: this.title,
        selectedMode: this.selectedMode,
        requirePhoto: this.requirePhoto,
        timing: this.timing,
        publishTime: this.publishTime,
        multiClass: this.multiClass,
        selectedClasses: this.selectedClasses,
        duration: this.duration, // 活动时长
        qiandaocode: this.qiandaocode,
        updateFrequency: this.updateFrequency,
        updatecode: this.updatecode,
        late_duration: this.late_duration,
        gesture_code: this.gesture_code,
        location: this.location,
        classList: this.classList,
      };
      // 打印表单数据查看
      console.log("表单数据:", formData);
      // 使用 axios 提交表单数据到服务器
      const token = localStorage.getItem("token"); // 获取存储的 token
      console.log(token);
      if (!token) {
        console.error("Token 不存在，用户未登录或认证失败。");
        return;
      }
      axios
        .post(this.baseURl + "attendance/publish_checkin/", formData, {
          headers: {
            Authorization: `Token ${token}`, // 在请求中携带 token
          },
        })
        .then((response) => {
          // 处理成功响应
          console.log("签到发送成功:", response.data);
          // this.connectWebSocket(formData.classes); // 发送签到后连接 WebSocket
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
    // --------------------------------------------------------------二维码----------------------------------------------
    generateRandomString(length) {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
    startGenerating() {
      this.isGenerating = true; // 开始生成二维码
      this.showModal(); // 显示模态弹窗
      if (this.updatecode) {
        const intervalId = setInterval(() => {
          if (this.isGenerating) {
            const randomString = this.generateRandomString(10); // 生成10位随机字符串
            console.log("生成随机字符串:", randomString);
            this.generateQRCode(randomString); // 使用随机字符串生成二维码
          } else {
            clearInterval(intervalId); // 停止定时器
          }
        }, this.updateFrequency);
      }
      // 页面加载后立即生成第一个二维码
      this.$nextTick(() => {
        this.generateQRCode(this.generateRandomString(10)); // 立即生成一个随机二维码
      });
    },
    // --------------------------------------------------------------二维码----------------------------------------------
  },
})
  .use(ElementPlus)
  .mount("#app");
