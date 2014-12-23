var Phoenix = require('../../vendor/phoenix');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var socket = new Phoenix.Socket(url);

    socket.join("presence", "global", {userId: id, role: 'student'}, function(channel) {
      console.log("student connected");

      channel.on("new:chat:student:" + id, function(chat) {
        console.log("student joining");
        socket.join("chats", chat.id, {userId: id, role: 'student'}, function(chatChannel) {
          chatChannel.send("student:joined", {});
        });
      });
    });
  };

  return {
    start: start
  };
}
