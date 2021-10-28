import { exec } from "child_process";
import { existsSync } from "fs";
import { join, resolve } from "path";
import supertest from "supertest";
import testApiUrl from "./test-api-url";
import { getDirname } from "../utils/index.js";
import { createProxyUtil, createSaveUtil } from "./cli.utils";

describe("save", () => {
  const name = "test-name";
  const proxy = createProxyUtil();
  const save = createSaveUtil();

  describe("with data folder", () => {
    const dataFolder = resolve(join(getDirname(import.meta.url), "data"));

    beforeAll(async () => {
      await proxy.start("-h", testApiUrl, "-d", dataFolder);
      await supertest("http://localhost:3000").get("/api/random");
      // wait for the server to write file
      await new Promise((resolve) => setTimeout(resolve, 100));
      await proxy.stop();

      await save.exec("-d", dataFolder, "-n", name);
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
      await proxy.start("-h", testApiUrl);
      await supertest("http://localhost:3000").get("/api/random");
      // wait for the server to write file
      await new Promise((resolve) => setTimeout(resolve, 100));
      await proxy.stop();
      await save.exec("-d", dataFolder, "-n", name);
    });

    it(`rename current directory into ${name}`, async () => {
      expect(existsSync(join(dataFolder, name))).toBeTruthy();
    });

    afterAll(() => {
      exec(`rm -rf ${dataFolder}`);
    });
  });
});
