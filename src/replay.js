/**
 * This router replay the sniffed data
 * @see proxy.js
 */
import { Router } from "express";
import { resolve, join, dirname } from "path";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getReplayRouter = ({ replayFolder = "current" }) => {
  const router = Router();
  const baseDataPath = resolve(
    join(
      __dirname,
      replayFolder === "current" ? ".." : ".",
      "data",
      replayFolder
    )
  );

  if (!existsSync(baseDataPath)) {
    throw new Error(`replay folder "${replayFolder}" does not exist`);
  }
  router.use("*", ({ originalUrl, baseUrl }, res, next) => {
    const dataPath = join(baseDataPath, `${baseUrl}`);

    if (existsSync(dataPath)) {
      console.log(`[replay] ${originalUrl}`);
      try {
        const status = readFileSync(
          join(dataPath, "statusCode.txt")
        ).toString();
        res.status(status);

        const headers = JSON.parse(
          readFileSync(join(dataPath, "headers.json"))
        );
        Object.entries(headers, ([key, value]) => res.setHeader(key, value));

        const data = readFileSync(join(dataPath, "data.json"));
        return res.send(data);
      } catch (error) {
        console.warn(`[replay] can't replay ${originalUrl} from ${dataPath}`);
      }
    }
    // fallback on mocks
    return next();
  });

  return router;
};

export default getReplayRouter;
