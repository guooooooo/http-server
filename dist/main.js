"use strict";

var _commander = _interopRequireDefault(require("commander"));

var _server = _interopRequireDefault(require("./server"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander.default.option("-p, --port <val>", "set http-serve port").parse(process.argv);

let config = {
  port: 8080
};
Object.assign(config, _commander.default);
let server = new _server.default(config);
server.start();