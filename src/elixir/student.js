var Phoenix = require('../../vendor/phoenix');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var socket = new Phoenix.Socket(url);

    socket.join("presence", "global", {userId: id, role: 'student'}, function(channel) {
      channel.on("new:chat:student:" + id, function(chat) {
        socket.join("chats", chat.id, {userId: id, role: 'student'}, function(chatChannel) {
          var messageCount = 0;

          chatChannel.on("chat:terminated", function(data) {
            console.log('Student ' + id + ' got disconnect message.');
            chatChannel.leave();
            channel.leave();
            socket.close();
          });

          chatChannel.on("student:receive", function(data) {
            chatChannel.send("student:send", {
              message: "Message #" + ++messageCount + " from student: " + id
            });
          });

          chatChannel.send("student:joined", {});
        });
      });
    });
  };

  return {
    start: start
  };
}
