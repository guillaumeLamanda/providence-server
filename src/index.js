import startServer from "./server.js";

// eslint-disable-next-line no-process-env
const port = process.env.PORT;
startServer({ port });
