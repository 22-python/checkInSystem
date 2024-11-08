const { createApp } = Vue;

createApp({
  data() {
    return {
      baseURL: "http://localhost:8000/", // 后端接口的地址
      userType: "student", // 默认用户类型
      userId: "", // 用户名
      password: "", // 密码
      passwordVisible: false, // 控制密码可见性
    };
  },
  methods: {
    async handleSubmit() {
      try {
        // 登录请求
        const response = await axios.post(`${this.baseURL}accounts/Login/`, {
          user_type: this.userType,
          user_id: this.userId,
          password: this.password,
        });
        console.log("登录成功:", response.data);

        // 存储 token 到 sessionStorage
        sessionStorage.setItem("token", response.data.token);

        // 登录成功后跳转
        this.redirectToPage(response.data.user_type);
      } catch (error) {
        // 捕获并使用弹窗显示错误，只显示 message 字段
        console.error(
          "登录失败:",
          error.response ? error.response.data : error.message
        );
        const errorMessage = error.response
          ? error.response.data.message
          : error.message;

        alert("登录失败: " + errorMessage);
      }
    },
    redirectToPage(userType) {
      if (userType === "student") {
        window.location.href = "student.html";
      } else if (userType === "teacher") {
        window.location.href = "teacher.html";
      }
    },
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible; // 切换密码显示状态
    },
  },
}).mount("#app");
