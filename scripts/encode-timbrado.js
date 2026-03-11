const fs = require("fs");
const path = require("path");
const imgPath = path.join(__dirname, "../public/timbrado-choconick.jpg");
const outPath = path.join(__dirname, "../src/lib/timbradoBase64.ts");
if (!fs.existsSync(imgPath)) {
  console.warn("Arquivo não encontrado: public/timbrado-choconick.jpg");
  fs.writeFileSync(outPath, "// Coloque public/timbrado-choconick.jpg e rode este script novamente.\nexport const TIMBRADO_BASE64 = \"\";\n");
  console.log("Arquivo placeholder criado. Adicione a imagem e rode: node scripts/encode-timbrado.js");
  process.exit(1);
}
const img = fs.readFileSync(imgPath);
const base64 = img.toString("base64");
const output = `export const TIMBRADO_BASE64 = 'data:image/jpeg;base64,${base64}';\n`;
fs.writeFileSync(outPath, output);
console.log("Timbrado convertido com sucesso!");
