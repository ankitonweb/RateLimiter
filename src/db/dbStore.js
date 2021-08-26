/* @flow */

import InMemoryStore from "./inMemory";
import { DBOptions } from "../types";
import RedisStore from "./RedisStore";
const debugLib = require("debug");
const debug = debugLib("ratelimiter:db:dbstore");
debug.enabled = true;

class Store {
  dbConnector: any;

  onConnectError(err) {
    throw new Error(`DB Connection error ${err}`);
  }

  onConnect() {
    debug("Connected to database");
  }

  constructor(opts = {}) {
    switch (opts.endpointType) {
      case "redis":
        debug("setting ['redis'] dbconnector");
        opts.onConnect = this.onConnect;
        opts.onConnectError = this.onConnectError;
        this.dbConnector = RedisStore(opts);
        break;

      case "inmemory":
        debug("setting ['inmemory'] dbconnector");
        this.dbConnector = InMemoryStore();
        break;
    }
  }

  getData = (key: string) => {
    return new Promise((resolve, reject) => {
      this.dbConnector
        .getData(key)
        .then((data) => resolve(data))
        .catch((_err) => reject("Data Not Found"));
    });
  };

  setData = (key: string, data: any) => {
    this.dbConnector.setData(key, data, function (err) {
      if (err) {
        debug("Error in setting data");
        throw new Error(`Error in setting key=${key}, data=${data}  !`);
      }
    });
  };

  updateData = (key: string, data: any) => {
    this.dbConnector.updateData(key, data, function (err) {
      if (err) {
        debug("Error in setting data");
        throw new Error(`Error in setting key=${key}, data=${data} !`);
      }
    });
  };
}

module.exports = (opts: any) => {
  return new Store(opts);
};
