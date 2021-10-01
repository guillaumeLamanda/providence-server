#!/usr/bin/env node

import { program, Command, Option } from "commander";
import { join, resolve } from "path";
import { renameSync, readdirSync, existsSync, readFileSync } from "fs";
import startServer from "./server.js";
import { getDataFolderPath, getDirname } from "./utils/index.js";
import { currentFolderName } from "./sniffer.js";

const { version } = JSON.parse(
  readFileSync(join(getDirname(import.meta.url), "../package.json"))
);

const defaultPort = "3000";

const isFolderEmpty = (folder) => {
  if (!existsSync(folder)) return true;
  return !readdirSync(folder, { withFileTypes: true }).filter(
    (file) => file.isDirectory() || file.isFile()
  ).length;
};

const getDataset = ({ dataFolderPath }) =>
  readdirSync(resolve(join(dataFolderPath)), {
    withFileTypes: true,
  })
    .filter((file) => file.isDirectory())
    .map(({ name }) => console.log(` - ${name}`));

const dataFolderOption = new Option(
  "-d, --data-folder <folder>",
  "folder used to write responses"
).default(join(getDirname(import.meta.url), "../data"));

const saveCommand = new Command("save")
  .description("save the current dataset into a the folder <name>")
  .requiredOption("-n, --name <name>", "backup name")
  .action(({ name }) => {
    const snifferDestFolder = process.env["data-folder"];
    const currentSnifferDirectory = join(
      getDataFolderPath(snifferDestFolder),
      currentFolderName
    );
    if (isFolderEmpty(currentSnifferDirectory)) {
      throw new Error(
        `no data to save in folder "${currentSnifferDirectory}". Please use sniffer mode to record`
      );
    }
    const targetDirectory = join(currentSnifferDirectory, name);
    renameSync(currentSnifferDirectory, targetDirectory);
  });

const replayCommand = new Command("replay")
  .description("replay a dataset")
  .option("-n, --name <name>", "Dataset to replay", "current")
  .option("-p, --port", "port", defaultPort)
  .action(({ port, name }) => {
    process.env["dataset-name"] = name;
    startServer({
      port,
      REPLAY: true,
      USE_PROXY: false,
    });
  });

const listCommand = new Command("ls")
  .description("list all datasets")
  .action(() => {
    const dataFolder = process.env["data-folder"];
    const dataFolderPath = getDataFolderPath(dataFolder);
    if (!existsSync(dataFolderPath))
      throw new Error(`data folder ${dataFolderPath} does not exist`);
    console.log("My dataset");
    getDataset({ dataFolderPath });
  })
  .alias("list");

program
  .version(version)
  .option("-p, --port", "port", defaultPort)
  .option("-h, --proxy-host <host>", "proxy host")
  .addOption(dataFolderOption)
  .on("option:data-folder", (dataFolder) => {
    process.env["data-folder"] = getDataFolderPath(dataFolder);
  })
  .option("-v, --verbose", "verbose mode")
  .action(({ port, replay, verbose, proxyHost, dataFolder }) => {
    if (!proxyHost)
      throw new Error("proxy host is required (option --proxy-host)");
    process.env["data-folder"] = getDataFolderPath(dataFolder);
    startServer({
      port,
      USE_LOGS: verbose,
      REPLAY: replay,
      proxyHost,
      destFolder: getDataFolderPath(dataFolder),
    });
  })
  .addCommand(saveCommand)
  .addCommand(replayCommand)
  .addCommand(listCommand);

program.parse(process.argv);
