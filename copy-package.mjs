import { mkdir, copyFile } from "fs/promises";

await mkdir("dist/netlify/functions", { recursive: true });
await copyFile("netlify/functions/package.json", "dist/netlify/functions/package.json");

