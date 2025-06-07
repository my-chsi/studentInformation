// 检测是否为移动设备
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 如果不是移动设备，重定向到提示页面或其他网址
if (!isMobileDevice()) {
    window.location.href = "../404.html"; // 替换为你的提示页面URL
}