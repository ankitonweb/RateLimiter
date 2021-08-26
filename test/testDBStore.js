const { assert, expect } = require("chai");
const moment = require("moment");
const axios = require("axios");
const Store = require("../dist/db/dbStore");

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
};

describe("Test DBStore-Inmemory", () => {
  var data = {
    t1: moment().unix(),
    t2: 0,
    c1: 1,
    c2: 0,
    timeout: opts.duration,
  };

  var dbStore = Store(opts);
  var ip1 = "10.100.1.140";

  dbStore.setData(ip1, data);

  it("should be able to access the value stored in DB", function () {
    return dbStore.getData(ip1).then((resolve) => {
      var result = JSON.parse(resolve);
      return expect(result.c1).equals(1);
    });
  });

  it("should be able to modify existing data", function () {
    dbStore.setData(ip1, data);
    dbStore.getData(ip1).then((resolve) => {
      let ldata = JSON.parse(resolve);
      ldata.c1++;
      dbStore.setData(ip1, ldata);
      dbStore.getData(ip1).then((resolve) => {
        var result = JSON.parse(resolve);
        return expect(result.c1).equals(ldata.c1);
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

describe("Test DBStore-Redis", () => {
  var data = {
    t1: moment().unix(),
    t2: 0,
    c1: 1,
    c2: 0,
    timeout: opts.duration,
  };
  opts.endpointType = "redis";
  var dbStore = Store(opts);
  var ip1 = "10.100.1.140";

  dbStore.setData(ip1, data);

  it("should be able to access the value stored in DB", function () {
    return dbStore.getData(ip1).then((resolve) => {
      var result = JSON.parse(resolve);
      return expect(result.c1).equals(1);
    });
  });

  it("should be able to modify existing data", function () {
    dbStore.setData(ip1, data);
    dbStore.getData(ip1).then((resolve) => {
      let ldata = JSON.parse(resolve);
      ldata.c1++;
      dbStore.setData(ip1, ldata);
      dbStore.getData(ip1).then((resolve) => {
        var result = JSON.parse(resolve);
        return expect(result.c1).equals(ldata.c1);
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
