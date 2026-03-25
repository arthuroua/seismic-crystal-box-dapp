const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const host = "0.0.0.0";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^([.][.][/\\])+/, "");
  return path.join(root, normalized);
}

http
  .createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
      return;
    }

    const reqPath = req.url === "/" ? "/index.html" : req.url;
    const filePath = safePath(reqPath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const type = types[ext] || "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "no-cache"
      });

      fs.createReadStream(filePath).pipe(res);
    });
  })
  .listen(port, host, () => {
    console.log(`Seismic dApp server running on ${host}:${port}`);
  });
