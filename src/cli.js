#!/usr/bin/env node

import { program, Command } from "commander";
import { resolve, join, dirname } from "path";
import { renameSync, readdirSync, existsSync, readFileSync } from "fs";
import startServer from "./server.js";
import { baseFolder as currentSnifferDirectory } from "./sniffer.js";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { version } = JSON.parse(
  readFileSync(join(__dirname, "../package.json"))
);

const defaultPort = "3000";
const datasetFolder = `${__dirname}/data`;

const isFolderEmpty = (folder) => {
  if (!existsSync(folder)) return true;
  return !readdirSync(folder, { withFileTypes: true }).filter(
    (file) => file.isDirectory() || file.isFile()
  ).length;
};

const getDataset = () =>
  readdirSync(datasetFolder, {
    withFileTypes: true,
  })
    .filter((file) => file.isDirectory())
    .map(({ name }) => console.log(` - ${name}`));

program
  .version(version)
  .option("-p, --port", "port", defaultPort)
  .requiredOption("-h, --proxy-host <host>", "proxy host")
  .option("-v, --verbose", "verbose mode")
  .action(({ port, replay, verbose, proxyHost }) => {
    startServer({
      port,
      USE_LOGS: verbose,
      REPLAY: replay,
      proxyHost,
    });
  })
  .addCommand(
    new Command("save")
      .option("-n, --name <name>", "backup name")
      .action(({ name }) => {
        if (isFolderEmpty(currentSnifferDirectory)) {
          throw new Error("no data to save. Please use sniffer mode to record");
        }
        const targetDirectory = join(resolve(__dirname), "data", name);
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
    new Command("ls").action(() => {
      console.log("My dataset");
      getDataset();
    })
  );

program.parse(process.argv);
