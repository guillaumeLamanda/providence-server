/**
 * This router replay the sniffed data
 * @see proxy.js
 */
import { Router } from "express";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

const getReplayRouter = ({ replayFolderPath }) => {
  const router = Router();

  if (!existsSync(replayFolderPath)) {
    throw new Error(`replay folder "${replayFolderPath}" does not exist`);
  }
  router.use("*", ({ originalUrl, baseUrl }, res, next) => {
    const dataPath = join(replayFolderPath, `${baseUrl}`);

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
