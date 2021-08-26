const RateLimiter=require('RateLimiter');



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

var rateLimiter=new RateLimiter(opts);
