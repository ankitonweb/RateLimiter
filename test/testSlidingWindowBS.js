/* @flow */

const { assert, expect, should } = require("chai");
const ApplicationServer = require("../dist-example/helper/applicationServer");
const http = require("http");

const opts = {
  maxRequest: 30,
  endpoint: "",
  duration: 60,
  endpointType: "inmemory",
  onConnectError: {},
  onConnect: {},
  keyGenerator: function (req) {
    return req.ip;
  },
  headers: true,
};

var applicationServer;

var result={
  errorCount:0,
  remaining:0, 
};

var executeAt=0;

async function sendTrafficWithIP(maxCount,expectedError){
    debug(`Now Calling sendTrafficWithIP  with ${maxCount},  expectedError=${expectedError}`);
    result.errorCount = 0;
    result.remaining = 0;
    debug("\n\n\t\tNow sending Traffic with key as IP Address\n\n");
    for(let i=1; i<=maxCount;i++){   
                      
            await  axios.get('http://localhost:9191/something')
              .then(res => { 
                      result.remaining = res.headers['x-ratelimit-remaining'];
                      return;
              })
              .catch(err => {    
                      result.remaining = err.response.headers['x-ratelimit-remaining'];    
                      result.errorCount++;
                      return;
              });
                      
      }

      return new Promise((resolve,reject)=>{
        if(expectedError ===  result.errorCount)
        {
          //  debug(`Test Successful errorOccured=${result.errorCount}, expectedError=${expectedError}  remaining=${result.remaining} `);
            return resolve(true);
  
        }else{
           // debug(`Test FAILED errorOccured=${result.errorCount}, expectedError=${expectedError} remaining=${result.remaining} `);
            return reject(false);
        }

      });
      
      
}

describe("Test Sliding Window With Binary Search", async () => {
  var server;
  before( ()=> {
    applicationServer = ApplicationServer();
    applicationServer.applyRateLimiter(opts,'/something');
    applicationServer.start(9191).then(result=>{
        //console.log(result);
      }).catch(err=>{
        throw new("Cant' spawn application server ");
        return;
      }
    );
  });

  after( () =>{
    applicationServer.stop();
  });


  it("should be able to send first request", function (done) {
         sendTrafficWithIP(1,0).then(resolve=>{
            assert.equal(resolve, true);
            done();
         }).catch(err=>{
            done();
         });

  });
  executeAt+=15000;
  /*it("should be able to send first request", function (done) {
      setTimeout(() => {
        sendTrafficWithIP(14,0).then(resolve=>{
            assert.equal(resolve, true);
            done();
         }).catch(err=>{
             done();
        });

      },executeAt); 
      
  });*/

});

