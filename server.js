const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.post("/run", (req, res) => {
  const code = req.body.code;
  const sourcePath = path.join(__dirname, "code.cpp");
  const outputPath = path.join(__dirname, "a.out");

  fs.writeFileSync(sourcePath, code);

  exec(`g++ ${sourcePath} -o ${outputPath} && ${outputPath}`, (err, stdout, stderr) => {
    if (err) return res.send(stderr);
    res.send(stdout);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
