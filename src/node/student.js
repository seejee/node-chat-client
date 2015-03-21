var io = require('socket.io-client');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var client     = io(url);
    var publish    = function(event, data) { client.emit(event, data); };
    var subscribe  = function(event, cb)   { client.on(event, cb); };

    var messageCount = 0;

    var connect = function() {
      publish('presence:student:connect', {
        userId: id,
        role:   'student'
      });
    };

    var disconnect = function() {
      publish('presence:student:disconnect', {
        userId: id,
        role:   'student'
      });
    };

    var onNewChat = function(chat) {
      console.log('Student ' + id + ' is starting new chat.');

      var sendChannel       = chat.sendChannel;
      var receiveChannel    = chat.receiveChannel;
      var terminatedChannel = chat.terminatedChannel;
      var joinedChannel     = chat.joinedChannel;

      subscribe(receiveChannel, function(data) {
        messageCount++;

        if(messageCount == 1) {
          console.log('Student ' + id + ' got first message.');
        }

        publish(sendChannel, {
          chatId:  chat.id,
          message: 'Message #' + messageCount + ' from student ' + id
        });
      });

      subscribe(terminatedChannel, function(data) {
        console.log('Student ' + id + ' got disconnect message.');
        disconnect();
      });

      publish(joinedChannel, { chatId: chat.id, userId: id });
    }

    client.on('connect_error', function(data) {
      console.log('student connection error: ', data);
    });

    subscribe('presence:new_chat:student:' + id, onNewChat);
    connect();
  }

  return {
    start: start
  };
}
