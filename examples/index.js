/* @flow */
import Server from './helper/server';
import ApplicationServer from './helper/applicationServer'
import { resolve } from 'path';
const { assert, expect } = require('chai');
const axios = require('axios');
const debugLib = require('debug');
const debug = debugLib('client:index');
const http = require('http');
debug.enabled = true;

var opts={
    maxRequest: 10,
    endpoint: "",
    duration: 300,
    endpointType: 'inmemory',
    onConnectError: {},
    onConnect: {},
    keyGenerator: function(req){
            return req.query.userid; 
           // return req.ip;
    },
    headers: true,
  };

  var optsWithIP={
        maxRequest: 100,
        endpoint: "",
        duration: 300,
        endpointType: 'inmemory',
        onConnectError: {},
        onConnect: {},
        keyGenerator: function(req){
                return req.ip; 
        },
        headers: true,
};

debug('Starting example'); 
var applicationServer = ApplicationServer();


async function sendTrafficWithUserID(maxCount){
        debug("\n\n\t\tNow sending Traffic with key as UserID\n\n");
        debug(`[Current rateLimit is (${opts.maxRequest}). We are sending (${maxCount}) requests, so (${maxCount - opts.maxRequest}) request should Fail]`);
                for(let i=1; i<=maxCount;i++)
                {       
                      await  axios.get('http://localhost:8080/something/otherthing',  
                                {
                                        params: {
                                         userid: 'ankit@bhandari'
                                } }).then(res => {
                      
                        })
                        .catch(err => {     
                                debug(`[Error: Caught at request no ${i} with error message=>'${err.message}']`);          
                        });
                               
                }
  }


  async function  throttleRateLimitWithUserID(maxCount){
        debug("\n\n\t\tNow sending traffic and throttle ratelimit on the fly\n\n");
        debug(`[Current rateLimit is (${opts.maxRequest}). We are sending (${maxCount}) requests and will throttle at request number (${opts.maxRequest+1}) few inflight request will also fail. `);
        for(let i=1; i<=maxCount;i++)
        {       
              await  axios.get('http://localhost:8080/something',  
                        {
                                params: {
                                 userid: 'ankit@bhandari'
                        } })
                .then(res => { })
                .catch(err => {
                        debug(`Error: caught at request no ${i} with error message => '${err.message}'`);
                        if( err.message === "Request failed with status code 429" && i == (opts.maxRequest+1)){    
                                debug(`\n\n\t\tNow throttling the maxRequest count from ${opts.maxRequest} to 500\n\n`);
                                opts.maxRequest = 500;
                                applicationServer.updateConfig(opts);
                        }    

                });
                       
        }


  }


  async function sendTrafficWithIP(maxCount){
        debug("\n\n\t\tNow sending Traffic with key as IP Address\n\n");
        debug(`[Current rateLimit is (${optsWithIP.maxRequest}). We are sending (${maxCount}) requests, so (${maxCount - optsWithIP.maxRequest}) request should Fail]`);
        for(let i=1; i<=maxCount;i++){               
              await  axios.get('http://localhost:8181/somethingnew')
                .then(res => {})
                .catch(err => {
                        debug(`[Error: Caught at request no ${i} with error message=>'${err.message}']`);     
  
                        });
                        
        }
}



async function sendMixedTraffic(maxCount,port,path){
        debug("\n\n\t\tNow sending Mixed Traffic with key as IP Address as well as User ID\n\n");
        debug(`[Current rateLimit is (${optsWithIP.maxRequest}). We are sending (${maxCount}) requests, so (${maxCount - optsWithIP.maxRequest}) request should Fail]`);
        let lport=port;
        for(let i=1 ; i<=maxCount;i++){               
              await  axios.put(`http://localhost:8888/somethingnew/whatelse`)
                .then(res => {})
                .catch(err => {
                        debug(`[Error: Caught at request no ${i} with error message=>'${err.message}']`);     
  
                        });
                        
        }
}


function runMixedTraffic(){
        optsWithIP.maxRequest = 100;
        const port = 8888;
        const path = '/somethingnew/whatelse';
        const count = 10;

        applicationServer = ApplicationServer();
       // applicationServer.applyRateLimiter(opts,'/');
        applicationServer.applyMultipleRateLimiter(opts,'/login',optsWithIP,path);
         applicationServer.start(port).then(result=>{
                  debug(result);
                  sendMixedTraffic(count,port,path).then(()=>{
                      //  applicationServer.stop();
                })
        });   
};
/*
 function runRateLimitWithIP(){
        optsWithIP.maxRequest = 100;
        applicationServer = ApplicationServer();
        applicationServer.applyRateLimiter(opts,'/');
        applicationServer.addMoreRateLimiter(optsWithIP,'/somethingnew');
         applicationServer.start(8181).then(result=>{
                  debug(result);
                  sendTrafficWithIP(115).then(()=>{
                        applicationServer.stop();
                        runMixedTraffic();
                })
        });   
};


 function  runThrottleRateLimit(){
        opts.maxRequest = 10;
        applicationServer = ApplicationServer();
        applicationServer.applyRateLimiter(opts,'/something');
         applicationServer.start(9090).then(result=>{
                  debug(result);
                  throttleRateLimitWithUserID(500).then(()=>{
                        applicationServer.stop();
                        runRateLimitWithIP();
                })
        });   
  
};

function main(){
      applicationServer.applyRateLimiter(opts,'/something/otherthing');
       applicationServer.start(8080).then(result=>{
        debug(result);
        sendTrafficWithUserID(13).then(()=>{
                 applicationServer.stop();
                 runThrottleRateLimit();       
                })
        });   

};
*/

runMixedTraffic();

//main();



  



  
