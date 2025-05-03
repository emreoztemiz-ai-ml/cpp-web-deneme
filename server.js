const express = require("express");
const fs = require("fs/promises"); // Promise tabanlı fs kullanımı
const { exec } = require("child_process");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const os = require("os");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Geçici dosyalar için dizin oluştur
const tempDir = path.join(os.tmpdir(), 'cpp_runner');
fs.mkdir(tempDir, { recursive: true }).catch(console.error);

// Dosya temizleme fonksiyonu
async function cleanUpFiles(...files) {
  for (const file of files) {
    try {
      await fs.unlink(file);
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(`Dosya silinemedi: ${file}`, err);
    }
  }
}

app.post("/run", async (req, res) => {
  if (!req.body.code) {
    return res.status(400).json({ error: "Kod gereklidir" });
  }

  const uniqueId = uuidv4();
  const sourcePath = path.join(tempDir, `code_${uniqueId}.cpp`);
  const outputPath = path.join(tempDir, `output_${uniqueId}`);
  const executableName = os.platform() === 'win32' ? `${outputPath}.exe` : outputPath;

  try {
    // Kodu dosyaya yaz
    await fs.writeFile(sourcePath, req.body.code);

    // Derle ve çalıştır
    const command = `g++ ${sourcePath} -o ${outputPath} && ${executableName}`;
    
    exec(command, { timeout: 5000 }, async (err, stdout, stderr) => {
      // Dosyaları temizle
      await cleanUpFiles(sourcePath, executableName);

      if (err) {
        return res.status(400).json({ 
          error: "Çalıştırma hatası",
          details: stderr || err.message 
        });
      }

      res.json({ 
        output: stdout || "Çıktı yok",
        error: stderr || null 
      });
    });

  } catch (err) {
    await cleanUpFiles(sourcePath, executableName);
    console.error("Sunucu hatası:", err);
    res.status(500).json({ error: "Sunucu hatası", details: err.message });
  }
});

// Sunucu kapatılırken geçici dizini temizle
process.on('SIGTERM', async () => {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (err) {
    console.error("Geçici dizin temizlenemedi:", err);
  }
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
