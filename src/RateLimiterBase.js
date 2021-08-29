/* @flow */
const debugLib = require("debug");
const debug = debugLib("ratelimiter:RateLimiterBase");
debug.enabled = true;
/*
     [Algorithm: Sliding window with BST ]
     
         header: if true, will add 'X-RateLimit' headers in the response.
       duration: Window size in  seconds    
     statusCode: On exceeding ratelimit, response code to be sent (429)  
     maxRequest: Max Request allowed with in particular duration/window
   keyGenerator: User can specify their custom keyGenerator, in this way we can
                   apply rate limit  based on different parameters of http request
                   for example userID, IP address, custom UUID etc.
*/

class RateLimiterBase {
  maxRequest: number;
  duration: number;
  headers: Boolean;
  statusCode: number;
  message: String;
  config: any;
  constructor(opts = {}) {
    this.config = {};
    this.config.maxRequest = opts.maxRequest || 100;
    this.config.duration = opts.duration || 3600;
    this.config.headers = opts.headers || false;
    this.config.statusCode = opts.statusCode || 429;
    this.config.message =
      opts.message || "Too many requests, please try again later.";
  }

  getMaxRequest = () => {
    return this.config.maxRequest;
  };

  getDuration = () => {
    return this.config.duration;
  };

  setDuration = (value) => {
    this.config.duration = value || 1;
  };

  setHeaders = (remaining: number, req, resp) => {
    if (this.config.headers) {
      resp.setHeader("X-RateLimit-Limit", this.config.maxRequest);
      resp.setHeader("X-RateLimit-Remaining", remaining);
    }
  };

  sendErrorMessage = (req, resp) => {
    resp.sendStatus(this.config.statusCode); //.send(this.config.message);
  };
  keyGenerator = (req) => {
    if (!this.customKeyGenerator) {
      return req.ip;
    } else {
      return this.customKeyGenerator(req);
    }
  };

  updateConfig = (opts) => {
    this.config.maxRequest = opts.maxRequest || 100;
    this.config.duration = opts.duration || 3600;
    this.config.headers = opts.headers || false;
    this.config.statusCode = opts.statusCode || 429;
    this.config.message =
      opts.message || "Too many requests, please try again later.";
  };
}
module.exports = RateLimiterBase;
