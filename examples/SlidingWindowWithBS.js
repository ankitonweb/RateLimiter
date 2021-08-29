/* @flow */
import ApplicationServer from './helper/applicationServer'
const axios = require('axios');
const debugLib = require('debug');
const debug = debugLib('client:SlidingWindowsBS');
const http = require('http');
debug.enabled = true;

var opts={
    maxRequest: 30,
    endpoint: "",
    duration: 60,
    endpointType: 'inmemory',
    onConnectError: {},
    onConnect: {},
    keyGenerator: function(req){
            return req.query.userid; 
    },
    headers: true,
  };

  var optsWithIP={
        maxRequest: 30,
        endpoint: "",
        duration: 60,
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

var result={
        errorCount:0,
        remaining:0, 
};



async function sendTrafficWithIP(maxCount,expectedError){
        debug(`Now Calling sendTrafficWithIP  with ${maxCount},  expectedError=${expectedError}`);
       result.errorCount = 0;
       result.remaining = 0;
        debug("\n\n\t\tNow sending Traffic with key as IP Address\n\n");
        for(let i=1; i<=maxCount;i++){   
                         
              await  axios.get('http://localhost:9191/something')
                .then(res => { 
                        //debug("X-rate-limit"+res.headers['x-ratelimit-remaining']);
                        result.remaining = res.headers['x-ratelimit-remaining'];
                })
                .catch(err => {
                        debug(`[Error: Caught at request no ${i} with error message=>'${err.message}']`);  
                        //debug(`[Error: Caught at request no ${i} with error message=>'${err.response.getHeader['X-RateLimit-Remaining']}']`);     
                        result.remaining = err.response.headers['x-ratelimit-remaining'];    
                        result.errorCount++;
                        
                });
                        
        }
        if(expectedError ==  result.errorCount)
        {
                debug(`Test Successful errorOccured=${result.errorCount}, expectedError=${expectedError}  remaining=${result.remaining} `);
                debug(`Waiting for next step `);
        }else{
                debug(`Test FAILED errorOccured=${result.errorCount}, expectedError=${expectedError} remaining=${result.remaining} `);
        }
        debug(`Waiting for next step ...`);
}


function sendTraffic(){

      
       var  executeAt=0;
        sendTrafficWithIP(1,0);                               //Allowed 29
        executeAt=executeAt+15000;
        setTimeout(() => sendTrafficWithIP(14,0), executeAt); //Allowed 15 ( All 14 should succed)
        executeAt=executeAt+20000;
        setTimeout(() => sendTrafficWithIP(15,0), executeAt); //Allowed 0 ( All 15 should succeed)
        executeAt=executeAt+25000;
        setTimeout(() => sendTrafficWithIP(15,14),executeAt);  //Allowed 0 ( Out of 15 only 1 will succed, 14 will fail ) 
        executeAt=executeAt+15000;
        setTimeout(() => sendTrafficWithIP(14,0),executeAt);   // Allowed  0 ( All 14 request should succeed)
        

}


//This is first test, it will call other tests once done.

function main(){
       applicationServer.applyRateLimiter(optsWithIP,'/something');
       applicationServer.start(9191).then(result=>{
        debug(result);
       
        sendTraffic();
        
       });

};





main();



  



  
