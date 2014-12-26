var Phoenix = require('../../vendor/phoenix');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var socket = new Phoenix.Socket(url);

    socket.join("presence", "teachers", {userId: id, role: 'teacher'}, function(channel) {
      var tryToClaimStudent = function(data) {
        if(data.students.waiting > 0) {
          channel.send('claim:student', {
            teacherId: id
          });
        }
      };

      channel.on("user:status", function(data) {
        console.log(data.students);
        if(data.students.total == 0) {
          process.exit();
        }

        tryToClaimStudent(data);
      });

      var messageCounts = {};

      channel.on("new:chat:" + id, function(chat) {
        socket.join("chats", chat.id, {userId: id, role: 'teacher'}, function(chatChannel) {
          console.log("Teacher " + id + " grabbed a new student.");

          var getMessageCount = function() {
            return messageCounts[chat.id] || 0;
          };

          var sendNextMessage = function() {
            var count = getMessageCount() + 1;
            messageCounts[chat.id] = count;

            chatChannel.send("teacher:send", {
              message: "Message from teacher: " + count
            });
          }

          chatChannel.on("chat:ready", function() {
            sendNextMessage();
          });

          chatChannel.on("chat:terminated", function(data) {
            //console.log("Teacher " + id + " is leaving a chat.");
            delete messageCounts[chat.id];
            chatChannel.leave();
          });

          chatChannel.on("teacher:receive", function(data) {
            if(getMessageCount() < options.messageCount) {
              sendNextMessage();
            }
            else {
              chatChannel.send("chat:terminate", {});
            }
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

