/* @flow */
const express = require("express");
const http = require("http");
import RateLimiter from "../../dist/RateLimiter";
const debugLib = require("debug");
const debug = debugLib("applicationServer");

debug.enabled = true;

const app = express();






class ApplicationServer {
  config: any;
  apiLimiter: any;
  server: any;
  apiLimiter: any;
  apiLimiter2: any;
  
  constructor() {
   
  }

  applyRateLimiter = (opts, path = "/") => {
    this.config = opts;
    this.apiLimiter = new RateLimiter(opts);

    app.use(path, this.apiLimiter.rateLimit);

    app.get(path, (req, res) => {
      res.send("Hello World!");
    });

    app.put(path, (req, res) => {
      res.send("Hello World!");
    });

    this.server = http.createServer(app);
  };



  applyMultipleRateLimiter = (opts1, path1, opts2, path2) => {
    this.config = opts1;
    this.apiLimiter = new RateLimiter(opts1);
    //this.arrayOfLimiter.push(this.apiLimiter);

    app.use(path1, this.apiLimiter.rateLimit);

    app.get(path1, (req, res) => {
      res.send("Hello World!");
    });

    this.apiLimiter2 = new RateLimiter(opts2);

    debug(`applying ratelimit at ${path2}`);
    app.use(path2, this.apiLimiter2.rateLimit);

    app.get(path2, (req, res) => {
      res.send("Hello World!");
    });

    app.put(path2, (req, res) => {
      res.send("Hello World!");
    });

    this.server = http.createServer(app);
  };

  start = (port = 8000) => {
    return new Promise((resolve, reject) => {
      app.listen(port, () => {
        debug(
          `Application Server(with RateLimiter) started at =>[ http://localhost:${port}]`
        );
        debug(`Current RateLimit config is => ${JSON.stringify(this.config)}`);
        return resolve(`Application Server started`);
      });
    });
  };

  stop = () => {
    debug("Shutting down Application Server");
    this.server.close(() => {
      debug("Server closed");
      return;
    });
  };

  updateConfig = (opts) => {
    this.apiLimiter.throttleRateLimit(opts);
    debug(`Updated  config to => ${JSON.stringify(opts)}`);
  };
}

module.exports = () => {
  return new ApplicationServer();
};
