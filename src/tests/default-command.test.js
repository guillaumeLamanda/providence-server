import { exec, spawn } from "child_process";
import { existsSync } from "fs";
import { join, resolve } from "path";
import supertest from "supertest";
import testApiUrl from "./test-api-url";
import { getDirname } from "../utils/index.js";

describe("providence", () => {
  describe("without options", () => {
    let process;
    beforeAll(async () => {
      process = spawn(resolve(`src/cli.js`), [
        "-h",
        testApiUrl,
        "-d",
        dataFolder,
      ]);
      await new Promise((resolve) => {
        process.stdout.on("data", (message) => {
          if (
            /Starting server with following configuration/.test(
              message.toString()
            )
          ) {
            resolve();
          }
        });
      });
    });

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

    afterAll(() => {
      process.kill("SIGHUP");
      exec(`rm -rf ${dataFolder}`);
    });
  });
});

const dataFolder = resolve(join(getDirname(import.meta.url), "data"));
