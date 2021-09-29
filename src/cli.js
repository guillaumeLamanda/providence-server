#!/usr/bin/env node

import { program, Command } from "commander";
import { join, dirname, resolve } from "path";
import { renameSync, readdirSync, existsSync, readFileSync } from "fs";
import startServer from "./server.js";
import { getBaseFolder } from "./sniffer.js";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { version } = JSON.parse(
  readFileSync(join(__dirname, "../package.json"))
);

const defaultPort = "3000";

const isFolderEmpty = (folder) => {
  if (!existsSync(folder)) return true;
  return !readdirSync(folder, { withFileTypes: true }).filter(
    (file) => file.isDirectory() || file.isFile()
  ).length;
};

const getDataset = ({ dataFolder }) =>
  readdirSync(resolve(join(dataFolder, "data")), {
    withFileTypes: true,
  })
    .filter((file) => file.isDirectory())
    .map(({ name }) => console.log(` - ${name}`));

program
  .version(version)
  .option("-p, --port", "port", defaultPort)
  .option("-h, --proxy-host <host>", "proxy host")
  .option("-d, --data-folder <folder>", "folder used to write responses")
  .option("-v, --verbose", "verbose mode")
  .action(({ port, replay, verbose, proxyHost, dataFolder: destFolder }) => {
    startServer({
      port,
      USE_LOGS: verbose,
      REPLAY: replay,
      proxyHost,
      destFolder,
    });
  })
  .addCommand(
    new Command("save")
      .option("-n, --name <name>", "backup name")
      .option("-d, --data-folder <folder>", "folder used to write responses")
      .action(({ name, dataFolder: snifferDestFolder }) => {
        const currentSnifferDirectory = getBaseFolder(snifferDestFolder);
        if (isFolderEmpty(currentSnifferDirectory)) {
          throw new Error("no data to save. Please use sniffer mode to record");
        }
        const targetDirectory = join(currentSnifferDirectory, "..", name);
        renameSync(currentSnifferDirectory, targetDirectory);
      })
  )
  .addCommand(
    new Command("replay")
      .option("-n, --name <name>", "Dataset to replay", "current")
      .option("-p, --port", "port", defaultPort)
      .action(({ name, port }) => {
        startServer({
          port,
          REPLAY: name,
          USE_PROXY: false,
        });
      })
  )
  .addCommand(
    new Command("ls")
      .alias("list")
      .option("-d, --data-folder <folder>", "folder used to write responses")
      .action(({ dataFolder, ...rest }) => {
        console.log("My dataset", rest, dataFolder);
        getDataset({ dataFolder });
      })
  );

program.parse(process.argv);
