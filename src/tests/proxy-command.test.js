import { exec } from "child_process";
import { existsSync } from "fs";
import { join, resolve } from "path";
import supertest from "supertest";
import { getDirname } from "../utils/index.js";
import testApiUrl from "./test-api-url";
import { createProxyUtil } from "./cli.utils";

describe("proxy", () => {
  const proxy = createProxyUtil();

  describe("with data folder", () => {
    const dataFolder = resolve(join(getDirname(import.meta.url), "data"));

    beforeAll(async () => {
      await proxy.start("-d", dataFolder, "-h", testApiUrl);
    });

    testDataWriting(dataFolder);

    afterAll(() => {
      proxy.stop();
      exec(`rm -rf ${dataFolder}`);
    });
  });

  describe("without data folder option", () => {
    beforeAll(async () => {
      await proxy.start("-h", testApiUrl);
    });

    testDataWriting();

    afterAll(() => {
      proxy.stop();
      exec(`rm -rf data/current`);
    });
  });
});

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
