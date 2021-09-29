import express, { json } from "express";
import { createServer } from "http";
import logger from "morgan";
import getReplayRouter from "./replay.js";
import proxyFactory from "./proxy.js";
import { join } from "path";
import { currentFolderName } from "./sniffer.js";

function start({
  port = "3000",
  proxyHost,
  REPLAY = false,
  USE_LOGS = false,
  destFolder,
}) {
  const app = express();

  /** REQUEST LOGS */

  app.use((req, res, next) => {
    if (USE_LOGS) {
      console.log(req.method, req.originalUrl);
    }

    next();
  });

  /** PROXY */
  const datasetName = process.env["dataset-name"] ?? currentFolderName;
  const getReplayFolder = () => {
    return join(process.env["data-folder"], datasetName);
  };
  const replayFolderPath = getReplayFolder();

  if (REPLAY) {
    app.use(
      getReplayRouter({
        replayFolderPath,
      })
    );
  }

  app.use(
    logger(`[proxy] :status :method :url :response-time ms`, { dev: true })
  );

  /**
   * @param {string} path
   * @param {import('express').RequestHandler} handler
   */
  const proxy = proxyFactory({ proxyHost, destFolder });
  app.use("*", (req, res) => {
    proxy(req, res);
  });

  app.use(json());

  /** SERVER SETUP */
  app.set("port", port);

  const httpServer = createServer(app);

  httpServer.on("error", (error) => {
    if (error.syscall !== "listen") {
      throw error;
    }

    switch (error.code) {
      case "EACCES":
        console.error(`Port ${port} requires elevated privileges`);
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(`Port ${port} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  httpServer.on("listening", () => {
    const addr = httpServer.address();
    console.log("Starting server with following configuration");
    console.table({
      hostname: "localhost",
      port: addr.port,
      proxy: proxyHost,
      replay: datasetName || REPLAY,
    });
  });

  httpServer.listen(port);
}

export default start;
