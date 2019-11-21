"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _http = _interopRequireDefault(require("http"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _util = _interopRequireDefault(require("util"));

var _url = _interopRequireDefault(require("url"));

var _mime = _interopRequireDefault(require("mime"));

var _chalk = _interopRequireDefault(require("chalk"));

var _ejs = _interopRequireDefault(require("ejs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  stat,
  readFile,
  writeFile,
  readdir
} = _fs.default.promises;

const template = _fs.default.readFileSync(_path.default.resolve(__dirname, "../template.html"), "utf8");

console.log(template);

class Server {
  constructor(config) {
    this.port = config.port;
    this.template = template;
  }

  async handleRequest(req, res) {
    let {
      pathname
    } = _url.default.parse(req.url, true); // 处理中文目录


    pathname = decodeURIComponent(pathname); // 找到当前执行命令的目录

    const filepath = _path.default.join(process.cwd(), pathname);

    try {
      const statObj = await stat(filepath);

      if (statObj.isDirectory()) {
        const dirs = await readdir(filepath);

        const tempalte = _ejs.default.render(this.template, {
          dirs,
          path: pathname === "/" ? "" : pathname
        });

        res.setHeader("Content-Type", "text/html;charset=utf-8");
        res.end(tempalte);
      } else {
        this.sendFile(filepath, req, res, statObj);
      }
    } catch (e) {
      this.sendError(e, req, res);
    }
  }

  sendFile(filepath, req, res, statObj) {
    const fileType = _mime.default.getType(filepath);

    res.setHeader("Content-Type", `${fileType};charset=utf-8`);

    _fs.default.createReadStream(filepath).pipe(res);
  }

  sendError(e, req, res) {
    console.log(e);
    res.statusCode = 404;
    res.end(`Not Found`);
  }

  start() {
    let server = _http.default.createServer(this.handleRequest.bind(this));

    server.listen(this.port, () => {
      console.log(`${_chalk.default.yellow("Starting up http-server, serving")} ${_chalk.default.blueBright("./")}
    Available on:
        http://127.0.0.1:${_chalk.default.green(this.port)}
        Hit CTRL-C to stop the server`);
    });
  }

}

var _default = Server;
exports.default = _default;