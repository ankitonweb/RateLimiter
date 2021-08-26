# RateLimiter


## Notes

- The mixing has to happen in the dummy peer if we do it at the asterisk end
  we'll get crazy echo cancellation stuff as it comes from multiple places

## Development

1. Build docker container with `npm run services-build`
2. `npm run services-up`

## Configuration

1. Default freeswitch URL : `wss://freeswitch:7443`
2. Enabling JSSIP debug: JsSIP.debug.enable('JsSIP:\*');
