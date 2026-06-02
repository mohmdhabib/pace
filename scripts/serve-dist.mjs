import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const root = normalize(fileURLToPath(new URL("../dist", import.meta.url)));

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = join(root, relative);

  try {
    const data = await readFile(filePath);
    response.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
    response.end(data);
  } catch {
    const data = await readFile(join(root, "index.html"));
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(data);
  }
});

server.listen(port, host, () => {
  console.log(`Pace preview running at http://${host}:${port}`);
});
