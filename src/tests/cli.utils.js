import { spawn } from "child_process";
import { resolve } from "path";

const cliPath = resolve("src/cli.js");

const waitForServerStart = async (process) => {
  await new Promise((resolve, reject) => {
    process.stdout.on("data", (message) => {
      if (
        /Starting server with following configuration/.test(message.toString())
      ) {
        resolve();
      }
    });
    process.on("error", reject);
  });
};

export const createProxyUtil = () => {
  let process;
  return {
    start: async (...args) => {
      process = spawn(cliPath, ["proxy", ...args]);
      await waitForServerStart(process);
    },
    stop: async () => {
      process.kill("SIGHUP");
      await new Promise((resolve) => process.on("exit", resolve));
    },
  };
};

export const createReplayUtil = () => {
  let process;
  return {
    start: async (...args) => {
      process = spawn(cliPath, ["replay", ...args]);
      await waitForServerStart(process);
    },
    stop: () => {
      process.kill("SIGHUP");
    },
  };
};

export const createSaveUtil = () => {
  return {
    exec: async (...args) => {
      const process = spawn(cliPath, ["save", ...args]);
      process.stderr.on("data", (message) => console.error(message.toString()));
      await new Promise((resolve, reject) => {
        process.on("exit", (code) => {
          if (code === 0) resolve();
          else reject(code);
        });
      });
    },
  };
};
