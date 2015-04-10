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

    socket.join("presence:student:" + id, student).receive('ok', function(channel) {
      channel.on("new:chat", function(chat) {
        socket.join("chats:" + chat.id, student).receive('ok', function(chatChannel) {
          console.log('Student ' + id + ' is starting new chat.');
          var messageCount = 0;

          chatChannel.on("chat:terminated", function(data) {
            console.log('Student ' + id + ' got disconnect message after ' + totalMessageCount + ' messages.');
            chatChannel.leave();
            channel.leave();
            socket.disconnect();
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

          chatChannel.push("student:joined", {});
        });
      });

      channel.push("student:ready", {userId: id});
    });
  };

  return {
    start: start
  };
}
