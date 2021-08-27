/* @flow */
const moment=require('moment');
const debugLib = require('debug');
const debug = debugLib('ratelimiter:RateLimiter');
import Store from './db/dbStore';
import RateLimiterBase from './RateLimiterBase';
import {DBOptions} from './types';
debug.enabled = true;

class RateLimiter extends RateLimiterBase {
    
        #dbStore: any;
      
       
        #customKeyGenerator:any;

        #keyGenerator=(req)=>{
            if( !this.#customKeyGenerator)
               return req.ip;
             else
               return this.#customKeyGenerator(req);    
       }

        constructor(opts = {}) {
             super(opts);
             this.#dbStore = Store(opts);
             if ( opts.keyGenerator)
                  this.#customKeyGenerator =  opts.keyGenerator;
        }
        /* 
         * Applying Sliding window with counter approach, keeping two timers t1 and t2 
         * 1. On first request timer t1 will be set with count c =1, 
         * 2. Second request within range of timelimit will be stored in t2
         * 3. Any request coming within the timelimit will just increment the counter t2.
         * 4. If number of request exceeds allowed limit,all subsequent request will be rejected till timeout.
         * 5. If currtime - t1 > timelimit , we will simply overwrite t1 and c1 counters with the value in t2 and c2
         *    and setting t2 with current timestamp. 
         *
         *  In this way we move our request limit with sliding window approach, we don't have to store each request's timestamp.
         * */
        #insertRecord=(key,req,resp,next)=>{
            const currTimeStamp = moment().unix(); 
            var data = {
                t1:currTimeStamp, 
                t2:0,
                c1:1,
                c2:0,
                timeout: this.getDuration(), // This timeout will be used with Redis to set the key expiry timer
            };
            this.#dbStore.setData(key,data);
            //modify header 
            this.setHeaders(this.getMaxRequest()-1,req,resp);
            next();
         }
        rateLimit=(req,resp,next)=> {
            let key = this.#keyGenerator(req);
            this.#dbStore.getData(key).then(record =>{
                                this.#checkRecord(key,record,req,resp,next)
                        }).catch(_err=>{
                                    this.#insertRecord(key,req,resp,next)
                        });                  
                        
        }

        #checkRecord=(key:string,record:any,req,resp,next)=>{
            const currTimeStamp = moment().unix();
            let data = JSON.parse(record);
            let totalReqCount = data.c1 + data.c2;
            if( (currTimeStamp - data.t1 ) < this.getDuration() ){
                //debug(" currTimeStamp timer t2");
                if(  totalReqCount < this.getMaxRequest() ){
                     data.c2 = data.c2 +1;
                     //debug(" Increamenting timer t2");
                     if( data.t2 == 0 ){
                        data.t2 = currTimeStamp;
                     }
                }else {
                   this.#rejectRequest(req,resp);
                   return;
                }

            }else{
                  let temp_t2 = data.t2;
                  let temp_c2 = data.c2;
                  data.t2 = currTimeStamp;
                  data.c2 = 1;
                  data.t1 = temp_t2;
                  data.c1 = temp_c2;
            }
            /* NOTE: Uncomment this log to see more detailed output */
           // debug(`Updating db for ${key} => ${JSON.stringify(data)}`);
            this.setHeaders((this.getMaxRequest()- data.c1 -  data.c2),req,resp);
            this.#dbStore.updateData(key,data);
            next();
        }

        #rejectRequest=(req,resp)=>{
            this.setHeaders((0),req,resp);
            this.sendErrorMessage(req,resp);
             
        }

        throttleRateLimit=(opts)=>{
                this.updateConfig(opts);
        }
};

module.exports=RateLimiter;
