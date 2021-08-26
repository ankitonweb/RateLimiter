export type DBOptions = {
  endpoint: string,
  endpointType: "inmemory",
  onConnectError: onConnectError,
  onConnect: onConnect,
};

export type ConfigOptions = {
  maxRequest: number,
  endpoint: string, // redis url, empty for inmemory
  duration: number,
  endpointType: string, //'inmemory/redis/',
  onConnectError: any,
  onConnect: any,
  keyGenerator: any /* function(req){ return req.ip; }, */,
  headers: boolean,
};

export interface dbInterface {
  +getData: (key: string) => Promise;
  +setData: (key: string, data: string, callback: function) => void;
  +removeData: (key: string) => void;
  +updateData: (key: string, data: string, callback: function) => void;
}
