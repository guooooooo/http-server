import progarm from "commander";
import Server from "./server";
progarm.option("-p, --port <val>", "set http-serve port").parse(process.argv);
let config = {
  port: 8080
};
Object.assign(config, progarm);
let server = new Server(config);
server.start();