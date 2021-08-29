/* @flow */
/*ConnectorStates object is used to store the states of connector.
 */

const debugLib = require("debug");
const debug = debugLib("ratelimiter:db:inmemory");
debug.enabled = true;

import { dbInterface } from "../types";
class InMemoryStore implements dbInterface {
  hashMap: any;
  constructor() {
    this.hashMap = new Map();
    return this;
  }

  getData = (key: string) => {
    return new Promise((resolve, reject) => {
      var data = this.hashMap.get(key);
      if (data) return resolve(data);
      else return reject("Data Not Found");
    });
  };

  setData = (key: string, data: any, timeout:number,setDataCallback) => {
    this.hashMap.set(key, JSON.stringify(data));
  };

  removeData = (key: string, deleteCallback) => {
    this.hashMap.delete(key);
  };

  updateData = (key: string, data: any, timeout:number, setDataCallback) => {
    /* In case of Redis, we will refresh  the expiry of  key */
    this.hashMap.set(key, JSON.stringify(data));
  };
}

module.exports = (opts = {}) => {
  return new InMemoryStore();
};
