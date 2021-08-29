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
         * Applying Sliding window with Binary Search approach, keeping three timers ts,tm,te;
         *  This algorithm is based on Sliding window + Binary search
         *  In this case Time range is divided into three segment ts(starttime), tm( mid time), te(end time). 
         *  Each  segment will have their own counters which will keep the count of request within particular time range.
         *    
         *  For example  if Duration is Duration=30 second then 
         *  Ts = currentTimeStamp+0;
         *  Tm = Ts+Duration/2
         *  Te = Ts+Duration;
         * 1. On first request timer ts will be set with current timestamp and  count cs=1, 
         * 2. If Second request comes  currentTime < mid , tm will be set to current time  and  cm=1
         * 3. Any request coming within the currentTime < Tm will just increment the counter cm.
         * 4. If number of request exceeds allowed limit,all subsequent request(cs+cm+ce) will be rejected till timeout.
         * 5. If request coming within the currentTime >= Tm will set te and c2
         * 6. If currtime - te > duration , we will simply slide the window. swapping values of ts<tm<te, cs<cm<ce
         *
         *  In this way we move our request limit with sliding window approach, we don't have to store each request's timestamp.
         * */
        #insertRecord=(key,req,resp,next)=>{
            const currTimeStamp = moment().unix(); 
            var data = {
                ts:currTimeStamp,  //TimeStamp
                cs:1,
                tm:0,  
                cm:0,
                te:0,
                ce:0,
            };
            this.#dbStore.setData(key,data);
            this.setHeaders(this.getMaxRequest()- data.cs -  data.cm -data.ce,req,resp);
            next();
        }

        rateLimit=(req,resp,next)=> {
            let key = this.#keyGenerator(req);
            this.#dbStore.getData(key).then(record =>{
                    this.#checkRecord(key,record,req,resp,next);
                }).catch(_err=>{
                    this.#insertRecord(key,req,resp,next);
            });                  
                        
        }

        #checkRecord=(key:string,record:any,req,resp,next)=>{
            const currTimeStamp = moment().unix();
            let data = JSON.parse(record);
            let totalReqCount = data.cs + data.cm + data.ce;
            
            if( (currTimeStamp - data.ts ) < this.getDuration() ){
                if(totalReqCount < this.getMaxRequest() ){
                    if((currTimeStamp - data.ts ) <= this.getDuration()/2){       
                        if(data.tm === 0){
                            data.cm = 0;
                            data.tm = currTimeStamp;  
                            data.te = 0;
                            data.ce = 0;
                        }  
                        data.cm++; 

                    }else{
                        data.ce++;  
                        if(data.te === 0){
                            data.te = currTimeStamp;     
                        }  
                    }
                
                }else {
                   this.#rejectRequest(req,resp);
                   return;
                }

            }else{
                
                data.ts = data.tm;
                data.cs = data.cm;
                data.tm = data.te;
                data.cm = data.ce+1;
                if( data.tm === 0 ){
                    data.tm = currTimeStamp;
                }
                data.te = 0;
                data.ce = 0;
                 
                  
            }
            /* NOTE: Uncomment this log to see more detailed output */
            //debug(`Updating db for ${key} => ${JSON.stringify(data)}, Remaining=${(this.getMaxRequest()- data.cs -  data.cm -data.ce)} `);
            this.setHeaders((this.getMaxRequest()- data.cs -  data.cm -data.ce),req,resp);
            this.#dbStore.updateData(key,data,this.getDuration());
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
