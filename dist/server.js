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

var _zlib = _interopRequireDefault(require("zlib"));

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

    const filePath = _path.default.join(process.cwd(), pathname);

    try {
      const statObj = await stat(filePath);

      if (statObj.isDirectory()) {
        const dirs = await readdir(filePath);

        const tempalte = _ejs.default.render(this.template, {
          dirs,
          path: pathname === "/" ? "" : pathname
        });

        res.setHeader("Content-Type", "text/html;charset=utf-8");
        res.end(tempalte);
      } else {
        this.sendFile(filePath, req, res, statObj);
      }
    } catch (e) {
      this.sendError(e, req, res);
    }
  }

  gzip(req, res) {
    const encoding = req.headers["accept-encoding"];

    if (encoding) {
      // 生成转换流
      if (encoding.match(/gzip/)) {
        res.setHeader("Content-Encoding", "gzip");
        return _zlib.default.createGzip();
      } else if (encoding.match(/deflate/)) {
        res.setHeader("Content-Encoding", "deflate");
        return _zlib.default.createDeflate();
      }

      return false;
    }

    return false;
  }

  cache(req, res, statObj) {
    const lastModified = statObj.ctime.toGMTString();
    res.setHeader("Last-Modified", lastModified);
    const ifModifiedSince = req.headers["if-modified-since"];

    if (ifModifiedSince) {
      if (ifModifiedSince === lastModified) {
        return true;
      }
    }

    return false;
  }

  sendFile(filePath, req, res, statObj) {
    res.setHeader("Cache-Control", "no-cache");
    const cache = this.cache(req, res, statObj);

    if (cache) {
      res.statusCode = 304;
      return res.end();
    }

    const flag = this.gzip(req, res);
    const fileType = _mime.default.getType(filePath) || "text/plain";
    res.setHeader("Content-Type", `${fileType};charset=utf-8`);

    if (!flag) {
      _fs.default.createReadStream(filePath).pipe(res);
    } else {
      _fs.default.createReadStream(filePath).pipe(flag).pipe(res);
    }
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