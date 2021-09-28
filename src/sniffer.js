import { mkdirSync, existsSync, createWriteStream, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

export const baseFolder = resolve(
  join(dirname(fileURLToPath(import.meta.url)), "..", "data", "current")
);

const ensurePath = (path) =>
  path.split("/").forEach((folder, index, array) => {
    if (index === array.length) return;
    const subPath = resolve(array.slice(0, index).join("/"));
    if (!existsSync(subPath)) {
      mkdirSync(subPath);
    }
  });

const sniffer = (url, response) => {
  try {
    ensurePath(baseFolder);
    const dataFile = join(baseFolder, url, `data.json`);
    ensurePath(dataFile);
    console.log(`[sniffer] writing ${dataFile}`);
    const writeStream = createWriteStream(dataFile);
    response.on("data", (chunk) => {
      writeStream.write(chunk);
    });
    response.on("end", () => {
      const statusFilePath = join(baseFolder, url, `statusCode.txt`);
      writeFileSync(statusFilePath, response.statusCode.toString());
      const headersFilePath = join(baseFolder, url, `headers.json`);
      writeFileSync(headersFilePath, JSON.stringify(response.headers, null, 2));
      writeStream.close();
    });
  } catch (error) {
    console.warn(`[sniffer] error writing data for ${url}`);
    console.error(error);
  }
};

const _sniffer = sniffer;
export { _sniffer as sniffer };
