var Phoenix = require('../../vendor/phoenix');

module.exports = function(options) {
  var start = function(url, id, done) {
    var totalMessageCount = 0;
    var socket  = new Phoenix.Socket(url);
    var student = { userId: id, role: 'student' };

    socket.onMessage(function() {
      totalMessageCount++;
    });

    socket.connect();

    var channel = socket.chan("presence:student:" + id, student);

    channel.on("new:chat", function(chat) {
      var messageCount = 0;
      var chatChannel = socket.chan("chats:" + chat.id, student);

      chatChannel.on("chat:terminated", function(data) {
        console.log('Student ' + id + ' got disconnect message after ' + totalMessageCount + ' messages.');
        chatChannel.leave();
        channel.leave();
        done();
      });

      chatChannel.on("student:receive", function(data) {
        messageCount++;

        if(messageCount == 1) {
          console.log('Student ' + id + ' got first message.');
        }

        chatChannel.push("student:send", {
          message: "Message #" + messageCount + " from student: " + id
        });
      });

      chatChannel.join().receive('ok', function() {
        console.log('Student ' + id + ' is starting new chat.');

        chatChannel.push("student:joined", {});
      });
    });

    channel.join().receive('ok', function() {
      channel.push("student:ready", {userId: id});
    });
  };

  return {
    start: start
  };
}
