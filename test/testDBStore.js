const { assert, expect } = require("chai");
const moment = require("moment");
const axios = require("axios");
const Store = require("../dist/db/dbStore");

const dbInterface=require('../dist/types');

class InMemoryStore implements dbInterface {
        hashMap: any;
        constructor() {
          this.hashMap = new Map();
          //return this;
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
};


const opts = {
  maxRequest: 5,
  endpoint: "",
  duration: 20,
  endpointType: "inmemory",
  onConnectError: {},
  onConnect: {},
  keyGenerator: function (req) {
    return req.ip;
  },
  headers: true,
  dbConnector: new InMemoryStore(), // This is just for an example, we can add our custom dbConnector here
};




describe("Test DBStore-Inmemory", () => {
  var data = {
    ts: moment().unix(),
    tm: 0,
    te: 0,
    ce: 1,
    cm: 0,
    cs:1,
    
  };

  var dbStore = Store(opts);
  var ip1 = "10.100.1.140";

  dbStore.setData(ip1, data,opts.duration);

  it("should be able to access the value stored in DB", function () {
    return dbStore.getData(ip1).then((resolve) => {
      var result = JSON.parse(resolve);
      return expect(result.cs).equals(1);
    });
  });

  it("should be able to modify existing data", function () {
    dbStore.setData(ip1, data,opts.duration);
    dbStore.getData(ip1).then((resolve) => {
      let ldata = JSON.parse(resolve);
      ldata.cs++;
      dbStore.setData(ip1, ldata,opts.duration);
      dbStore.getData(ip1).then((resolve) => {
        var result = JSON.parse(resolve);
        return expect(result.cs).equals(ldata.cs);
      });
    });
  });

  it("should return empty if data not exist", function () {
    var ip2 = "10.100.2.142";
    dbStore
      .getData(ip2)
      .then((resolve) => {})
      .catch((err) => {
        return expect(err).equals("Data Not Found");
      });
  });
});



/* NOTE Comment out this test case if REDIS is not running locally */
describe("Test DBStore-Redis", () => {
  var data = {
    ts: moment().unix(),
    tm: 0,
    te: 0,
    cs: 1,
    cm: 0,
    ce: 0,
  };

  const optsRedis = {
    maxRequest: 5,
    endpoint: "",   // Please don't forget to provide redis endpoint url
    duration: 20,
    endpointType: "redis",
    onConnectError: {},
    onConnect: {},
    keyGenerator: function (req) {
      return req.ip;
    },
    headers: true,
  };
  if( optsRedis.endpoint !== "")
  { 
      var dbStore = Store(optsRedis);
      var ip1 = "10.100.1.140";

      dbStore.setData(ip1, data,opts.duration);

  

      it("should be able to access the value stored in DB", function () {
        return dbStore.getData(ip1).then((resolve) => {
          var result = JSON.parse(resolve);
          return expect(result.cs).equals(1);
        });
      });

      it("should be able to modify existing data", function () {
        dbStore.setData(ip1, data,opts.duration);
        dbStore.getData(ip1).then((resolve) => {
          let ldata = JSON.parse(resolve);
          ldata.cs++;
          dbStore.setData(ip1, ldata,opts.duration);
          dbStore.getData(ip1).then((resolve) => {
            var result = JSON.parse(resolve);
            return expect(result.cs).equals(ldata.cs);
          });
        });
      });

      it("should return empty if data not exist", function () {
        var ip2 = "10.100.2.142";
        dbStore
          .getData(ip2)
          .then((resolve) => {})
          .catch((err) => {
            return expect(err).equals("Data Not Found");
          });
      });
  } 
});
