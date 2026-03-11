const fs = require("fs");
const path = require("path");
const content = fs.readFileSync(
  path.join(__dirname, "../src/lib/timbradoBase64.ts"),
  "utf8"
);
const m = content.match(/base64,([\s\S]*?)(?:'|"|\`)/);
if (!m) {
  console.log("no match");
  process.exit(1);
}
const b64 = m[1].replace(/\s/g, "");
const b = Buffer.from(b64, "base64");
const sofMarkers = [0xc0, 0xc1, 0xc2]; // SOF0, SOF1, SOF2
let i = 2;
while (i < b.length - 9) {
  if (b[i] === 0xff && sofMarkers.includes(b[i + 1])) {
    const height = b.readUInt16BE(i + 5);
    const width = b.readUInt16BE(i + 7);
    const PAGE_W_MM = 210;
    const heightMm = ((height / width) * PAGE_W_MM).toFixed(2);
    console.log("width_px=" + width + " height_px=" + height + " height_mm=" + heightMm);
    process.exit(0);
  }
  i++;
}
console.log("SOF not found");
