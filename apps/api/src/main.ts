// Point d'entrée provisoire : le socle NestJS (#15) remplacera ce fichier.
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 3000);

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404).end();
});

server.listen(port, () => {
  console.log(`API provisoire sur http://localhost:${port}/health`);
});
