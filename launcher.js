const http = require("http");
const handler = require("serve-handler");
const open = require("open");

const port = process.env.PORT || 8000;

const server = http.createServer((req, res) =>
  handler(req, res, {
    public: __dirname,
  })
);

server.listen(port, async () => {
  const url = `http://localhost:${port}/index.html`;
  await open(url);
  console.log(`Server is running at ${url}`);
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
