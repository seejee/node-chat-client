var io    = require('socket.io-client');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var socket = io(url, {multiplex: false})
    var messageCount = 0;

    var onReady = function() {
      console.log('ready');
      socket.emit('/presence/student/connect', {
        userId: id,
        role:   'student'
      });
    };

    var disconnect = function() {
      socket.emit('/presence/student/disconnect', {
        userId: id,
        role:   'student'
      });

      socket.disconnect();
    };

    var onNewChat = function(data) {
      console.log('Student ' + id + ' is starting new chat.');

      var sendChannel       = data.sendChannel;
      var receiveChannel    = data.receiveChannel;
      var terminatedChannel = data.terminatedChannel;
      var joinedChannel     = data.joinedChannel;

      socket.on(receiveChannel, function(data) {
        messageCount++;

        if(messageCount == 1) {
          console.log('Student ' + id + ' got first message.');
        }

        socket.emit(sendChannel, {
          message: 'Message #' + messageCount + ' from student ' + id
        });
      });

      socket.on(terminatedChannel, function(data) {
        console.log('Student ' + id + ' got disconnect message.');
        disconnect();
      });

      socket.emit(joinedChannel, { userId: id });
    }

    socket.on('/presence/new_chat/student/' + id, onNewChat);
    socket.on('/presence/ready', onReady);
  }

  return {
    start: start
  };
}
