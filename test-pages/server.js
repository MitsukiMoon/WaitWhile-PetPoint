import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(join(fileURLToPath(new URL("..", import.meta.url))));
const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relativePath = pathname === "/"
    ? "test-pages/fake-waitwhile.html"
    : pathname.toLowerCase() === "/forms/externalreportapp.aspx"
      ? "test-pages/fake-rabies-reports.html"
      : pathname.replace(/^\/+/, "");
  const filePath = normalize(join(root, relativePath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    if (!statSync(filePath).isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(3000, "127.0.0.1", () => {
  console.log("Fake Waitwhile is ready at http://localhost:3000/test-pages/fake-waitwhile.html");
});
