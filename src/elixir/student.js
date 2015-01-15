var Phoenix = require('../../vendor/phoenix');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var socket  = new Phoenix.Socket(url);
    var student = { userId: id, role: 'student' };

    socket.join("presence:students", student, function(channel) {
      channel.on("new:chat", function(chat) {
        if(chat.student_id == id) {
          socket.join("chats:" + chat.id, student, function(chatChannel) {
            console.log('Student ' + id + ' is starting new chat.');
            var messageCount = 0;

            chatChannel.on("chat:terminated", function(data) {
              console.log('Student ' + id + ' got disconnect message.');
              channel.leave();
              socket.close();
            });

            chatChannel.on("student:receive", function(data) {
              messageCount++;

              if(messageCount == 1) {
                console.log('Student ' + id + ' got first message.');
              }

              chatChannel.send("student:send", {
                message: "Message #" + messageCount + " from student: " + id
              });
            });

            chatChannel.send("student:joined", {});
          });
        }
      });

      channel.send("student:ready", {userId: id});
    });
  };

  return {
    start: start
  };
}
