# RateLimiter
Rate Limiting helps to protect services against abusive behaviors targeting the application layer like Denial-of-service (DOS) attacks, brute-force password attempts etc. These attacks are usually look like they are coming from real users, but are typically generated by machines (or bots). As a result, these attacks are often harder to detect and can more easily bring down a service, application, or an API.

Our Rate Limiter should meet the following requirements:

### Functional Requirements:

  - Limit the number of requests an entity can send to any application/API within a time window, e.g., 15 requests per second.
  - Ratelimit should be designed to work with applications running in clusture mode.
  - User should be notifed with an error message whenever the defined threshold is crossed.
  - Ratelimit should be able to adapt to the changed traffic conditions.  We should be able to throttle the rate limit on the fly without affecting services.

### Non-Functional Requirements:

  - The system should be highly available and scalable.
  - Our rate limiter should not introduce substantial latencies affecting the user experience.

## Design

Basic idea behind rate limit API calls if to restrict sudden bust of request originating from a particular source (ip) or user. There are other factors that can be applied to uniquely identify the request but those all can be done for registered / authenticated / logged-in users. Once user is logged-in we can extract uuid and other parameters to keep track of the requests. Real challenge is to control the unauthenticated requests. For example, failed login-attempts, forgot passwords etc.

To implement ratelimiter API there are different methods which are as follows:-

   ### Fixed Window
In this approach we simply store the count of request and the start-time of the request. If number of requests exceeds the limit within the speficied time window, we will reject all the subsequent requests till the timeout occurs. This method has a shortcomming, if somebody simply sends bunch of request just before window expires, he can again send the traffic as soon as new window starts. So in inspite of ratelimit attacker will be allowed to pump 2x of the traffic it is allowed to send.    
    
   ### Sliding Window
In this approach we can keep track of each request per user/source. We can store the timestamp of each request in a hashTable/Redis/memcached/dynamodb other NOSQL based database.In this way we can restrict user to make only allowed number of request with-in particular time window. There is one big drawback, we might have keep appending the timestamp if the allowed number of request within given timeframe is high. This causes big memory/storage consumption also less scalable.

   ### Sliding Window - With Counter ( Current implementation)
   
   In this approach we reduce the need of extra memory required to keep track of additional timestamp by keeping only 2 timestamps(t1 & t2) and 2 counters(c1 & c2). 
   
   Lets say for example some application allows user to make 100 requests per hour..
   ```
   [1] Request at 05:00:00 AM set [t1=1629977000, c1=1, t2=0, c2=0] => Request Allowed
   [2] Request at 05:00:10 AM set [t1=1629977000, c1=1,t2=1629977010, c2=1] =>Request Allowed
   [3] Request at 05:01:00 AM set [t1=1629977000, c1=1,t2=1629977010, c2=2] =>Request Allowed 
   
       [Note here we have only incremented the c2 we have not modified the timestamp c2] 
       
   [4] Soon lot of request comes and we keep on incrementing counter c2 till the max count reaches
   
       [t1=1629977000, c1=1,t2=1629977010, c2=99] =>Request Allowed
       
   [5] 101th request at 05:45:00 AM set [t1=1629977000, c1=1,t2=1629977010, c2=99] =>Request Rejected with 429
   [6] Once limit is reached, all the request placed within that time window will be rejected.
   [7] After timeout (1 hour), new request will be allowed and counter will be swapped. Now c1 will hold the counter of c2 and t1 will hold the timestamp of t2.
   [8] Request at 06:00:00 AM set  [t1=1629977010, c1=99,t2=1629980600, c2=1] =>Request Allowed 
    
    As we can see from above soon the next request will be rejected ( because it crosses the max allowed limit). But it will soon be rolled over in next 10 second  as window will slide further. 
   ```
   There are some limitations of this approach as it expects the consistent traffic.
   
   ```
   
   ```

![image](https://user-images.githubusercontent.com/5471191/130944031-7c2b1e8c-722f-45fe-a94a-01e10fd7a44f.png)


## Implementation
  
  - RateLimiter solution provides flexibility to choose custom `key Generator` and self managed database. We have provided the interface which can be use to implement any databse connecter and can easily be plugged into ratelimiter. 
  - RateLimiter solution also provided flexibility to throttle the rate of request on the fly.
  - 
  - On using *redis dbconnector* we can utilize apply expiery timer for key stored in db. 

  ### Interfaces and configuration 
  
  ```javascript
     import RateLimiter from "RateLimiter"; 
     const ratelimiter =  
  ```
  
  ```javascript
  const ConfigForAuthenticated = {
      maxRequest: 1000,              // Maximum number of requests allowed within in [duration] time limit.
      endpoint: "",                 // endpoint url eg. redis:// , dynamo etc. Empty for Inmemory
      duration: 3600,               // Time window size in seconds, maxRequests allowed in this time window.
      endpointType: "inmemory",     //  endpointType inmemory/redis/dynamo etc.
      onConnectError: {},           // Optional for inmemory, good to have for redis and other db connectors
      onConnect: {},                // Same as above.
      keyGenerator: function (req) { // keyGenerator passed to RateLimiter, it counts the nunber of requests based on the key
                                     //  return req.query.userid;  // We can customize the unique key comes with http request. For now we will just continue using ip.
        return req.ip;
      },
      headers: true,                 // If true it appends the Rate limit information in header
  };
  ```


## Example

