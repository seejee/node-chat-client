var Phoenix = require('../../vendor/phoenix');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var socket = new Phoenix.Socket(url);

    socket.join("presence", "global", {userId: id, role: 'teacher'}, function(channel) {
      console.log("teacher connected");

      var tryToClaimStudent = function(data) {
        if(data.students.waiting > 0) {
          channel.send('claim:student', {
            teacherId: id
          });
        }
      };

      channel.on("user:status", function(data) {
        tryToClaimStudent(data);
      });

      channel.on("new:chat:teacher:" + id, function(chat) {
        console.log("teacher joining");
        socket.join("chats", chat.id, {userId: id, role: 'teacher'}, function(chatChannel) {
          chatChannel.on("chat:ready", function() {
            console.log("student is ready");
          });

          chatChannel.send("teacher:joined", {});
        });
      });
    });
  };

  return {
    start: start
  };
}

