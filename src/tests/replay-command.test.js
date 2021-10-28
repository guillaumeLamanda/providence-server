import { exec } from "child_process";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import supertest from "supertest";
import testApiUrl from "./test-api-url";
import { getDirname } from "../utils/index.js";
import { createProxyUtil, createReplayUtil } from "./cli.utils";

describe("replay", () => {
  const replay = createReplayUtil();

  describe("with data folder", () => {
    const dataFolder = resolve(join(getDirname(import.meta.url), "data"));

    beforeAll(async () => {
      const proxy = createProxyUtil();
      await proxy.start("-h", testApiUrl, "-d", dataFolder);
      await supertest("http://localhost:3000").get("/api/random");
      // wait for the server to write file
      await new Promise((resolve) => setTimeout(resolve, 100));
      proxy.stop();

      await replay.start("-d", dataFolder);
    });

    it("should replay the written file", async () => {
      const writtenBody = JSON.parse(
        readFileSync(join(dataFolder, "current", "api", "random", "data.json"))
      );
      const { body } = await supertest("http://localhost:3000").get(
        "/api/random"
      );
      expect(JSON.parse(body.toString())).toStrictEqual(writtenBody);
    });

    afterAll(() => {
      replay.stop();
      exec(`rm -rf ${dataFolder}`);
    });
  });

  describe("without data folder", () => {
    const dataFolder = resolve("data");
    beforeAll(async () => {
      const proxy = createProxyUtil();
      await proxy.start("-h", testApiUrl);
      await supertest("http://localhost:3000").get("/api/random");
      // wait for the server to write file
      await new Promise((resolve) => setTimeout(resolve, 100));
      proxy.stop();

      await replay.start();
    });

    it("should replay the written file", async () => {
      const writtenBody = JSON.parse(
        readFileSync(join(dataFolder, "current", "api", "random", "data.json"))
      );
      const { body } = await supertest("http://localhost:3000").get(
        "/api/random"
      );

      expect(JSON.parse(body.toString())).toStrictEqual(writtenBody);
    });

    afterAll(() => {
      replay.stop();
      exec(`rm -rf ${dataFolder}`);
    });
  });
});
