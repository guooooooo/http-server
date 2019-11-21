import http from "http";
import fs from "fs";
import path from "path";
import util from "util";
import url from "url";
const {
  stat,
  readFile,
  writeFile,
  readdir
} = fs.promises;
import mime from "mime";
import chalk from "chalk";
import ejs from "ejs";
const template = fs.readFileSync(path.resolve(__dirname, "../template.html"), "utf8");
console.log(template);

class Server {
  constructor(config) {
    this.port = config.port;
    this.template = template;
  }

  async handleRequest(req, res) {
    let {
      pathname
    } = url.parse(req.url, true); // 处理中文目录

    pathname = decodeURIComponent(pathname); // 找到当前执行命令的目录

    const filepath = path.join(process.cwd(), pathname);

    try {
      const statObj = await stat(filepath);

      if (statObj.isDirectory()) {
        const dirs = await readdir(filepath);
        const tempalte = ejs.render(this.template, {
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
    const fileType = mime.getType(filepath);
    res.setHeader("Content-Type", `${fileType};charset=utf-8`);
    fs.createReadStream(filepath).pipe(res);
  }

  sendError(e, req, res) {
    console.log(e);
    res.statusCode = 404;
    res.end(`Not Found`);
  }

  start() {
    let server = http.createServer(this.handleRequest.bind(this));
    server.listen(this.port, () => {
      console.log(`${chalk.yellow("Starting up http-server, serving")} ${chalk.blueBright("./")}
    Available on:
        http://127.0.0.1:${chalk.green(this.port)}
        Hit CTRL-C to stop the server`);
    });
  }

}

export default Server;