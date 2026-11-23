import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);

function loadEnvFile() {
  if (process.env.NVIDIA_API_KEY) return;
  try {
    const text = readFileSync(join(root, ".env"), "utf8");
    text.split(/\r?\n/).forEach(line => {
      const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!match) return;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    });
  } catch {}
}

const contentTypes = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json" };

const server = createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/chat") {
    loadEnvFile();
    let body = "";
    request.on("data", chunk => { body += chunk; if (body.length > 100000) request.destroy(); });
    request.on("end", async () => {
      try {
        const apiKey = process.env.NVIDIA_API_KEY;
        if (!apiKey) {
          response.writeHead(400, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: "Configura NVIDIA_API_KEY en el archivo .env" }));
          return;
        }
        const { messages } = JSON.parse(body);
        const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ model: process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct", messages, temperature: 0.2, max_tokens: 700 })
        });
        const data = await upstream.text();
        response.writeHead(upstream.status, { "Content-Type": "application/json" });
        response.end(data);
      } catch (error) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Error al contactar NVIDIA" }));
      }
    });
    return;
  }

  if (request.method !== "GET") {
    response.writeHead(405);
    response.end();
    return;
  }
  let path = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  path = normalize(path).replace(/^(\.\.[/\\])+/, "");
  try {
    const filePath = join(root, path);
    if (!(await stat(filePath)).isFile()) throw new Error("Not found");
    const data = await readFile(filePath);
    response.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream" });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("404");
  }
});

server.listen(port, () => console.log(`Sitio disponible en http://localhost:${port}`));
