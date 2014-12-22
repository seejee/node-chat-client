var faye    = require('faye');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var client       = new faye.Client(url);
    var messageCount = 0;

    var chatSub      = null;
    var newChatSub   = null;
    var terminateSub = null;

    var connect = function() {
      client.publish('/presence/student/connect', {
        userId: id,
        role:   'student'
      });
    };

    var disconnect = function() {
      client.publish('/presence/student/disconnect', {
        userId: id,
        role:   'student'
      });

      chatSub.cancel();
      newChatSub.cancel();
      terminateSub.cancel();
      client.disconnect()
    };

    var onNewChat = function(data) {
      var sendChannel      = data.sendChannel;
      var receiveChannel   = data.receiveChannel;
      var terminateChannel = data.terminateChannel;

      console.log('Student ' + id + ' is starting new chat.');

      chatSub = client.subscribe(receiveChannel, function(data) {
        console.log('student got chat message', data);

        client.publish(sendChannel, {
          message: 'Message from student: ' + ++messageCount
        });
      });

      terminateSub = client.subscribe(terminateChannel, function(data) {
        disconnect();
      });
    }

    newChatSub = client.subscribe('/presence/new_chat/student/' + id, onNewChat);

    connect();
  }

  return {
    start: start
  };
}
