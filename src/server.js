import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import url from "url";
import zlib from "zlib";
const { stat, readFile, writeFile, readdir } = fs.promises;

import mime from "mime";
import chalk from "chalk";
import ejs from "ejs";

const template = fs.readFileSync(
  path.resolve(__dirname, "../template.html"),
  "utf8"
);
class Server {
  constructor(config) {
    this.port = config.port;
    this.template = template;
  }

  async handleRequest(req, res) {
    let { pathname } = url.parse(req.url, true);
    // 处理中文目录
    pathname = decodeURIComponent(pathname);
    // 找到当前执行命令的目录
    const filePath = path.join(process.cwd(), pathname);
    try {
      const statObj = await stat(filePath);
      if (statObj.isDirectory()) {
        const dirs = await readdir(filePath);
        const tempalte = ejs.render(this.template, {
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
        return zlib.createGzip();
      } else if (encoding.match(/deflate/)) {
        res.setHeader("Content-Encoding", "deflate");
        return zlib.createDeflate();
      }
      return false;
    }
    return false;
  }

  cache(filePath, req, res, statObj) {
    const lastModified = statObj.ctime.toGMTString();
    res.setHeader("Last-Modified", lastModified);
    const ifModifiedSince = req.headers["if-modified-since"];

    const ETag = crypto.createHash('md5')
      .update(fs.readFileSync(filePath))
      .digest('base64');
    res.setHeader('ETag', ETag);
    const ifNoneMatch = req.headers['if-none-match'];

    if (!ifModifiedSince || ifModifiedSince !== lastModified) {
      return false;
    }
    if (!ifNoneMatch || ifNoneMatch !== ETag) {
      return false;
    }
    return true;
  }

  sendFile(filePath, req, res, statObj) {
    res.setHeader("Cache-Control", "max-age=10");
    const cache = this.cache(filePath, req, res, statObj);
    if (cache) {
      res.statusCode = 304;
      return res.end();
    }

    const flag = this.gzip(req, res);
    const fileType = mime.getType(filePath) || "text/plain";
    res.setHeader("Content-Type", `${fileType};charset=utf-8`);
    if (!flag) {
      fs.createReadStream(filePath).pipe(res);
    } else {
      fs.createReadStream(filePath)
        .pipe(flag)
        .pipe(res);
    }
  }

  sendError(e, req, res) {
    console.log(e);
    res.statusCode = 404;
    res.end(`Not Found`);
  }

  start() {
    let server = http.createServer(this.handleRequest.bind(this));
    server.listen(this.port, () => {
      console.log(
        `${chalk.yellow("Starting up http-server, serving")} ${chalk.blueBright(
          "./"
        )}
    Available on:
        http://127.0.0.1:${chalk.green(this.port)}
        Hit CTRL-C to stop the server`
      );
    });
  }
}

export default Server;
