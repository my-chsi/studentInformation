const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const url = require("url");

const PORT = 8848;
const PUBLIC_DIR = __dirname; // 静态文件目录

// 定义MIME类型映射
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = `.${parsedUrl.pathname}`;

  // 安全检查：防止目录遍历攻击
  if (pathname.includes("..")) {
    res.statusCode = 403;
    return res.end("禁止访问");
  }

  // 处理根路径，默认加载index.html
  if (pathname === "./") {
    pathname = "./index.html";
  }

  // 构建完整文件路径
  const filePath = path.join(PUBLIC_DIR, pathname);

  try {
    // 检查文件是否存在
    await fs.access(filePath);

    // 获取文件状态
    const stat = await fs.stat(filePath);

    if (req.headers["if-none-match"]) {
      const clientETag = req.headers["if-none-match"];
      const serverETag = `${stat.size}-${stat.mtimeMs}`;
      if (clientETag === serverETag) {
        res.statusCode = 304;
        res.end();
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${
            req.url
          } -> 304 Not Modified`
        );
        return;
      }
    }
    // 如果是目录，尝试加载index.html
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      await fs.access(filePath);
    }

    // 读取文件内容
    const content = await fs.readFile(filePath);

    // 获取文件扩展名并确定MIME类型
    const ext = path.parse(filePath).ext;
    const contentType = mimeTypes[ext] || "application/octet-stream";

    // 设置响应头并返回文件内容
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", `no-cache`);
    res.setHeader("ETag", `${stat.size}-${stat.mtimeMs}`);
    res.statusCode = 200;
    res.end(content);

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} -> 200 OK`
    );
  } catch (error) {
    // 文件不存在
    if (error.code === "ENOENT") {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html");
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 Not Found</title>
        </head>
        <body>
          <h1>404 Not Found</h1>
          <p>请求的资源不存在</p>
        </body>
        </html>
      `);
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${
          req.url
        } -> 404 Not Found`
      );
    } else {
      // 其他错误
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain");
      res.end("服务器内部错误");
      console.error(
        `[${new Date().toISOString()}] ${req.method} ${
          req.url
        } -> 500 Internal Server Error`
      );
      console.error(error);
    }
  }
});

// 监听所有可用IP地址的指定端口
server.listen(PORT, "127.0.0.1", () => {
  console.log(`服务器运行在 http://127.0.0.1:${PORT}/`);
  console.log(`静态文件目录: ${PUBLIC_DIR}`);
});

// 处理未捕获的异常
process.on("uncaughtException", (err) => {
  console.error("未捕获的异常:", err);
  // 可以选择重启服务器或执行其他清理操作
});

// 处理未处理的Promise拒绝
process.on("unhandledRejection", (reason, promise) => {
  console.error("未处理的Promise拒绝:", promise, "原因:", reason);
});
