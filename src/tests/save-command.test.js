import { exec, spawn } from "child_process";
import { existsSync } from "fs";
import { join, resolve } from "path";
import supertest from "supertest";
import testApiUrl from "./test-api-url";
import { getDirname } from "../utils/index.js";

describe("save", () => {
  let process;
  const name = "test-name";

  describe("with data folder", () => {
    const dataFolder = resolve(join(getDirname(import.meta.url), "data"));

    beforeAll(async () => {
      process = await startWithArgs(
        "proxy",
        "-h",
        testApiUrl,
        "-d",
        dataFolder
      );
      await supertest("http://localhost:3000").get("/api/random");
      // wait for the server to write file
      await new Promise((resolve) => setTimeout(resolve, 100));
      process.kill("SIGHUP");

      await startWithArgs("save", "-d", dataFolder, "-n", name);
    });

    it(`rename current directory into ${name}`, async () => {
      expect(existsSync(join(dataFolder, name))).toBeTruthy();
    });

    afterAll(() => {
      exec(`rm -rf ${dataFolder}`);
    });
  });

  describe("without data folder", () => {
    const dataFolder = resolve("data");
    beforeAll(async () => {
      process = await startWithArgs("proxy", "-h", testApiUrl);
      await supertest("http://localhost:3000").get("/api/random");
      // wait for the server to write file
      await new Promise((resolve) => setTimeout(resolve, 100));
      process.kill("SIGHUP");
      await startWithArgs("save", "-d", dataFolder, "-n", name);
    });

    it(`rename current directory into ${name}`, async () => {
      expect(existsSync(join(dataFolder, name))).toBeTruthy();
    });

    afterAll(() => {
      exec(`rm -rf ${dataFolder}`);
    });
  });
});

const startWithArgs = async (...args) => {
  const process = spawn(resolve(`src/cli.js`), args);
  await new Promise((resolve, reject) => {
    process.stdout.on("data", (message) => {
      if (
        /Starting server with following configuration/.test(message.toString())
      ) {
        resolve();
      }
    });
    process.stdout.on("error", console.error);
    process.on("error", (error) => {
      reject(error);
    });
    process.on("exit", () => {
      resolve();
    });
  });
  return process;
};
