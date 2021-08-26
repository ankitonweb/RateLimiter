/* @flow */

const { assert, expect, should } = require("chai");
const moment = require("moment");
const axios = require("axios");
const Store = require("../dist/db/dbStore");
const Server = require("../dist-example/helper/server");
const http = require("http");

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

describe("Test RateLimiter", async () => {

  let port=8888;
  let localServer = Server(opts,port);

  it("should be able to create RateLimiter Object", function (done) {
    http.get("http://localhost:8888", function (res) {
      assert.equal(200, res.statusCode);
      done();
    });
  });

  it("should get 4xx on exceeding limit RateLimiter Object", function (done) {
    for (let i = 0; i <= opts.maxRequest + 2; i++) {
      http.get("http://localhost:8888", (res) => {
        if (i >= opts.maxRequest) 
            assert.equal(429, res.statusCode);
      });
    }
    done();
  });
});

describe("Test Different KeyGenerator", () => {
  const port = 8100;
  const optsUserID = {
    maxRequest: 5,
    endpoint: "",
    duration: 20,
    endpointType: "inmemory",
    onConnectError: {},
    onConnect: {},
    keyGenerator: function (req) {
      return req.query.userid;
    },
    headers: true,
  };
  let appServer = Server(optsUserID, port);
  it("should be able to create RateLimiter Object", function () {
    axios
      .get("http://localhost:" + port, {
        params: {
          userid: "ankitbhandari@gmail.com",
        },
      })
      .then((res) => {
        expect(res.status).equals(200);
      })
      .catch((err) => {});
  });
});
