import { exec, spawn } from "child_process";
import { existsSync } from "fs";
import { join, resolve } from "path";
import supertest from "supertest";
import testApiUrl from "./test-api-url";
import { getDirname } from "../utils/index.js";

describe("proxy", () => {
  let process;

  describe("with data folder", () => {
    const dataFolder = resolve(join(getDirname(import.meta.url), "data"));

    beforeAll(async () => {
      process = await startWithArgs("-d", dataFolder);
    });

    testDataWriting(dataFolder);

    afterAll(() => {
      process.kill("SIGHUP");
      exec(`rm -rf ${dataFolder}`);
    });
  });

  describe("without data folder option", () => {
    beforeAll(async () => {
      process = await startWithArgs();
    });

    testDataWriting();

    afterAll(() => {
      process.kill("SIGHUP");
      exec(`rm -rf data/current`);
    });
  });
});

const startWithArgs = async (...args) => {
  const process = spawn(resolve(`src/cli.js`), [
    "proxy",
    "-h",
    testApiUrl,
    ...args,
  ]);
  await new Promise((resolve) => {
    process.stdout.on("data", (message) => {
      if (
        /Starting server with following configuration/.test(message.toString())
      ) {
        resolve();
      }
    });
  });
  return process;
};

function testDataWriting(dataFolder = "data") {
  describe("when the server receive a request", () => {
    beforeAll(async () => {
      await supertest("http://localhost:3000").get("/api/random");
    });

    it("should write the response data", async () => {
      expect(
        existsSync(join(dataFolder, "current/api/random/data.json"))
      ).toBeTruthy();
    });

    it("should write the response headers", async () => {
      expect(
        existsSync(join(dataFolder, "current/api/random/headers.json"))
      ).toBeTruthy();
    });

    it("should write the response status code", async () => {
      expect(
        existsSync(join(dataFolder, "current/api/random/statusCode.txt"))
      ).toBeTruthy();
    });
  });
}
