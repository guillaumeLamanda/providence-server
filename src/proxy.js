import { request } from "https";
import omit from "lodash.omit";
import { sniffer } from "./sniffer.js";

const proxy =
  ({ proxyHost, destFolder }) =>
  (originalRequest, originalResponse) => {
    const options = {
      host: proxyHost,
      path: originalRequest.originalUrl,
      method: originalRequest.method,
      headers: omit(originalRequest.headers, [
        "host",
        "user-agent",
        "accept-encoding",
      ]),
    };
    const apiRequest = request(options, (apiResponse) => {
      originalResponse.set(apiResponse.headers);
      originalResponse.writeHead(apiResponse.statusCode);
      sniffer(
        destFolder,
        originalRequest.baseUrl + originalRequest.path,
        apiResponse
      );
      apiResponse.on("data", (chunk) => {
        originalResponse.write(chunk);
      });
      apiResponse.on("close", () => originalResponse.end());
      apiResponse.on("end", () => originalResponse.end());
    }).on("error", (e) => {
      originalResponse.writeHead(500);
      originalResponse.write(e.message);
      originalResponse.end();
    });
    originalRequest.on("data", (chunk) => apiRequest.write(chunk));
    originalRequest.on("close", () => apiRequest.end());
    originalRequest.on("end", () => apiRequest.end());
  };

export default proxy;
