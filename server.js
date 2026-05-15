import http from "node:http";

const portRaw = process.env.PORT ?? process.argv[2] ?? "8080";
const port = Number.parseInt(portRaw, 10);
const maxBodyBytesRaw = process.env.MAX_BODY_BYTES ?? "65536";
const maxBodyBytes = Number.parseInt(maxBodyBytesRaw, 10);

if (!Number.isFinite(port) || port <= 0 || port > 65535) {
  console.error(`Invalid port: ${portRaw}`);
  process.exit(1);
}

const effectiveMaxBodyBytes = Number.isFinite(maxBodyBytes) && maxBodyBytes >= 0 ? maxBodyBytes : 65536;

function nowIso() {
  return new Date().toISOString();
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let keptBytes = 0;
    let truncated = false;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;

      if (keptBytes >= effectiveMaxBodyBytes) {
        truncated = true;
        return;
      }

      const remaining = effectiveMaxBodyBytes - keptBytes;
      const keptChunk = chunk.length <= remaining ? chunk : chunk.subarray(0, remaining);
      chunks.push(keptChunk);
      keptBytes += keptChunk.length;

      if (keptChunk.length < chunk.length) {
        truncated = true;
      }
    });

    req.on("end", () => {
      resolve({
        body: Buffer.concat(chunks).toString("utf8"),
        totalBytes,
        keptBytes,
        truncated
      });
    });

    req.on("error", reject);
  });
}

function logRequest(req, bodyInfo) {
  const remote = `${req.socket.remoteAddress ?? "unknown"}:${req.socket.remotePort ?? ""}`;
  console.log("");
  console.log("=".repeat(80));
  console.log(`[${nowIso()}] ${req.method ?? "UNKNOWN"} ${req.url ?? "/"}`);
  console.log(`remote: ${remote}`);
  console.log("headers:");
  console.log(JSON.stringify(req.headers, null, 2));

  if (bodyInfo.totalBytes > 0) {
    console.log(`body (${bodyInfo.keptBytes}/${bodyInfo.totalBytes} bytes${bodyInfo.truncated ? ", truncated" : ""}):`);
    console.log(bodyInfo.body);
  } else {
    console.log("body: <empty>");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const bodyInfo = await readRequestBody(req);
    logRequest(req, bodyInfo);

    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8"
    });
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error(`[${nowIso()}] failed to read request`, error);
    res.writeHead(500, {
      "content-type": "application/json; charset=utf-8"
    });
    res.end(JSON.stringify({ ok: false, error: "failed_to_read_request" }));
  }
});

server.on("clientError", (error, socket) => {
  console.error(`[${nowIso()}] client error`, error.message);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Log server listening on http://localhost:${port}`);
  console.log(`Max logged body size: ${effectiveMaxBodyBytes} bytes`);
});
