import { mkdir, copyFile } from "fs/promises";

await mkdir("dist/functions", { recursive: true });
await copyFile("functions/package.json", "dist/functions/package.json");
