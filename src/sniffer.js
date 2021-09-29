import { createWriteStream, writeFileSync } from "fs";
import { join } from "path";
import { ensurePath } from "./utils/index.js";

export const currentFolderName = "current";

export const sniffer = (destinationFolder, url, response) => {
  try {
    ensurePath(destinationFolder);
    const responseDestinationFolder = join(
      destinationFolder,
      currentFolderName,
      url
    );
    const dataFile = join(responseDestinationFolder, `data.json`);
    ensurePath(dataFile);
    console.log(`[sniffer] writing ${dataFile}`);
    const writeStream = createWriteStream(dataFile);
    response.on("data", (chunk) => {
      writeStream.write(chunk);
    });
    response.on("end", () => {
      const statusFilePath = join(responseDestinationFolder, `statusCode.txt`);
      writeFileSync(statusFilePath, response.statusCode.toString());
      const headersFilePath = join(responseDestinationFolder, `headers.json`);
      writeFileSync(headersFilePath, JSON.stringify(response.headers, null, 2));
      writeStream.close();
    });
  } catch (error) {
    console.warn(`[sniffer] error writing data for ${url}`);
    console.error(error);
  }
};
