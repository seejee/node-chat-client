var io = require('socket.io-client');
var totalMessageCount = 0;

module.exports = function(options) {
  var url    = options.url;
  var client = io(url, {'force new connection': false, transports: ['websocket']});
  var publish    = function(event, data) { client.emit(event, data); };

  var subscribe  = function(event, cb)   {
    client.on(event, function(data) {
      totalMessageCount++;
      cb(data);
    });
  };

  var start = function(id, done) {
    publish('ping');

    subscribe('pong', function(data) {
      ++totalMessageCount;

      console.log(totalMessageCount);

      if(totalMessageCount >= 1000000) {
        done();
        return;
      }

      publish('ping');
    });
  }

  return {
    start: start
  }
};

