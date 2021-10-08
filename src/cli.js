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
  readdirSync(resolve(dataFolderPath), {
    withFileTypes: true,
  })
    .filter((file) => file.isDirectory())
    .map(({ name }) => console.log(` - ${name}`));

const setDataFolderInEnvVariables = (dataFolder) => {
  process.env["data-folder"] = getDataFolderPath(dataFolder);
};

const dataFolderOption = new Option(
  "-d, --data-folder <folder>",
  "folder used to write responses"
).default(getDefaultDataFolderPath());

const portOption = new Option("-p, --port", "port").default(defaultPort);

const datasetNameOption = new Option(
  "-n, --name <name>",
  "Dataset name"
).default("current");

const saveCommand = new Command("save")
  .description("save the current dataset into a the folder <name>")
  .requiredOption("-n, --name <name>", "backup name")
  .addOption(dataFolderOption)
  .on("option:data-folder", setDataFolderInEnvVariables)
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
    const targetDirectory = join(snifferDestFolder, name);
    renameSync(currentSnifferDirectory, targetDirectory);
  });

const replayCommand = new Command("replay")
  .description("replay a dataset")
  .addOption(datasetNameOption)
  .addOption(dataFolderOption)
  .addOption(portOption)
  .on("option:data-folder", setDataFolderInEnvVariables)
  .action(({ port, name }) => {
    console.log({ name });

    process.env["dataset-name"] = name;

    startServer({
      port,
      REPLAY: true,
      USE_PROXY: false,
    });
  });

const listCommand = new Command("ls")
  .description("list all datasets")
  .addOption(dataFolderOption)
  .on("option:data-folder", setDataFolderInEnvVariables)
  .action(() => {
    const dataFolder = process.env["data-folder"];

    const dataFolderPath = getDataFolderPath(
      dataFolder || getDefaultDataFolderPath()
    );
    if (!existsSync(dataFolderPath))
      throw new Error(`data folder ${dataFolderPath} does not exist`);
    console.log("My dataset");
    getDataset({ dataFolderPath });
  })
  .alias("list");

const proxyCommand = new Command("proxy")
  .option("-p, --port", "port", defaultPort)
  .requiredOption("-h, --host <host>", "proxy host")
  .addOption(dataFolderOption)
  .on("option:data-folder", setDataFolderInEnvVariables)
  .option("-v, --verbose", "verbose mode")
  .action(({ port, verbose, host, dataFolder }) => {
    startServer({
      port,
      USE_LOGS: verbose,
      REPLAY: false,
      proxyHost: host,
      destFolder: getDataFolderPath(dataFolder),
    });
  });

const ensureDataFolderOnCommand = (command) => {
  if (!command.getOptionValue("data-folder")) {
    command.setOptionValue("data-folder", getDefaultDataFolderPath());
    process.env["data-folder"] = getDefaultDataFolderPath();
  }
  return command;
};

program
  .version(version)
  .addCommand(ensureDataFolderOnCommand(proxyCommand))
  .addCommand(ensureDataFolderOnCommand(saveCommand))
  .addCommand(ensureDataFolderOnCommand(replayCommand))
  .addCommand(ensureDataFolderOnCommand(listCommand));

program.parse(process.argv);
function getDefaultDataFolderPath() {
  return join(getDirname(import.meta.url), "../data");
}
