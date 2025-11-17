const fs = require("fs");
const path = require("path");

const destDir = path.join(__dirname, "dist", "netlify", "functions");
const destFile = path.join(destDir, "package.json");

fs.mkdirSync(destDir, { recursive: true });

const pkg = {
  type: "module"
};

fs.writeFileSync(destFile, JSON.stringify(pkg, null, 2));

console.log("Created ES module package.json in dist/netlify/functions");
