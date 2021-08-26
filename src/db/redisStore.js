/* @flow */
import debugLib from "debug";
const debug = debugLib("ratelimiter:db:redisstore");
debug.enabled = true;
const redis = require("redis");
import dbInterface from "./redisStore.js";

class RedisStore implements dbInterface {
  constructor(opts = {}) {
    this.endpoint = opts.endpoint;
    this.client = redis.createClient(this.endpoint);
    this.client.on("error", opts.onConnectError);
    this.client.on("connect", opts.onConnect);
  }

  getData = (key) => {
    return new Promise((resolve, reject) => {
      this.client.get(key, (_err, result) => {
        if (result) resolve(result);
        else reject("Data Not Found");
      });
    });
  };

  setData = (key, data: any, setDataCallback: function) => {
    this.client.set(key, JSON.stringify(data), setDataCallback); //, 'EX', data.timeout, setDataCallback);
    this.client.expire(key, data.timeout);
  };

  removeData = (key, deleteCallback) => {
    this.client.del(key, deleteCallback);
  };

  updateData = (key, data, setDataCallback) => {
    this.client.set(key, JSON.stringify(data), setDataCallback);
    this.client.expire(key, data.timeout);
    // this.client.set(key, JSON.stringify(data), 'EX', data.timeout, setDataCallback);
  };
}

module.exports = (opts = {}) => {
  return new RedisStore(opts);
};
