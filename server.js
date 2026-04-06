const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const host = "0.0.0.0";
const generatedDir = path.join(root, "assets", "generated");

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

function readJsonBody(req, limitBytes = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      body += chunk.toString("utf8");
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http");
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${hostHeader}`;
}

function ensureGeneratedDir() {
  fs.mkdirSync(generatedDir, { recursive: true });
}

http
  .createServer(async (req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
      return;
    }

    if (req.method === "POST" && req.url === "/api/card-upload") {
      try {
        const payload = await readJsonBody(req);
        const imageDataUrl = String(payload.imageDataUrl || "");
        const m = imageDataUrl.match(/^data:image\/png;base64,(.+)$/);
        if (!m) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "imageDataUrl must be PNG data URL" }));
          return;
        }

        const nick = String(payload.nick || "").slice(0, 32);
        const country = String(payload.country || "").slice(0, 32);
        const messages = Number(payload.messages || 0);
        const magnitude = Number(payload.magnitude || 0);
        const imageBuffer = Buffer.from(m[1], "base64");

        if (imageBuffer.length < 1024 || imageBuffer.length > 8 * 1024 * 1024) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "image size must be between 1KB and 8MB" }));
          return;
        }

        ensureGeneratedDir();
        const id = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
        const imageName = `card-${id}.png`;
        const metaName = `card-${id}.json`;
        const imagePath = path.join(generatedDir, imageName);
        const metaPath = path.join(generatedDir, metaName);
        fs.writeFileSync(imagePath, imageBuffer);

        const origin = getOrigin(req);
        const imageUrl = `${origin}/assets/generated/${imageName}`;
        const metadataUrl = `${origin}/assets/generated/${metaName}`;
        const metadata = {
          name: `Seismic Info Card - ${nick || "User"}`,
          description: "User-generated Seismic Info Card NFT.",
          image: imageUrl,
          external_url: `${origin}/card-maker.html`,
          attributes: [
            { trait_type: "Nick", value: nick || "-" },
            { trait_type: "Country", value: country || "-" },
            { trait_type: "Discord Messages", value: Number.isFinite(messages) ? Math.max(0, Math.floor(messages)) : 0 },
            { trait_type: "Magnitude", value: Number.isFinite(magnitude) ? Math.min(9, Math.max(1, Math.floor(magnitude))) : 1 }
          ]
        };
        fs.writeFileSync(metaPath, JSON.stringify(metadata));

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, metadataUri: metadataUrl, imageUrl }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error.message || "Upload failed" }));
      }
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
