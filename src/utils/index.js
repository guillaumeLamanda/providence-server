import { existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export const getDirname = (metaUrl) => dirname(fileURLToPath(metaUrl));

export const getDataFolderPath = (dataFolder) => resolve(dataFolder);

export const ensurePath = (path) =>
  path.split("/").forEach((folder, index, array) => {
    if (index === array.length) return;
    const subPath = resolve(array.slice(0, index).join("/"));
    if (!existsSync(subPath)) {
      mkdirSync(subPath);
    }
  });
