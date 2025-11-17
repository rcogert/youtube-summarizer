// copy-func-package.cjs
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "dist", "netlify", "functions");
const outFile = path.join(srcDir, "package.json");

// Ensure dist/netlify/functions exists
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

// Create the minimal package.json required by Netlify
const pkg = {
  type: "module"
};

fs.writeFileSync(outFile, JSON.stringify(pkg, null, 2));
console.log("Created ES module package.json in dist/netlify/functions");
