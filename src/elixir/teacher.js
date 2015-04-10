var Phoenix = require('../../vendor/phoenix');
var totalMessageCount = 0;

module.exports = function(options) {
  var start = function(url, id, done) {
    var socket = new Phoenix.Socket(url);

    socket.onMessage(function() {
      totalMessageCount++;
    });

    socket.connect();
    socket.join("presence:teachers", {userId: id, role: 'teacher'}).receive('ok', function(channel) {
      var messageCounts = {};
      var lastStats     = null;
      var numStudents   = 0;

      var tryToClaimStudent = function() {
        if(numStudents < 5 && (lastStats == null || lastStats.students.waiting > 0)) {
          channel.push('claim:student', {
            teacherId: id
          });
        }
      };

      var handleNewChat = function(chat) {
        numStudents++;
        socket.join("chats:" + chat.id, {userId: id, role: 'teacher'}).receive('ok', function(chatChannel) {
          console.log("Teacher " + id + " grabbed a new student.");

          var getMessageCount = function() {
            return messageCounts[chat.id] || 0;
          };

          var sendNextMessage = function() {
            var count = getMessageCount() + 1;
            messageCounts[chat.id] = count;

            chatChannel.push("teacher:send", {
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

            numStudents--;
            tryToClaimStudent();
          });

          chatChannel.on("teacher:receive", function(data) {
            if(getMessageCount() < options.messageCount) {
              sendNextMessage();
            }
            else {
              chatChannel.push("chat:terminate", {});
            }
          });

          chatChannel.push("teacher:joined", {});
        });
      };

      channel.on("user:status", function(data) {
        lastStats = data;
        if(data.students.total == 0) {
          console.log("Total: " + totalMessageCount);
          done();
        }
      });

      channel.on("new:chat:" + id, handleNewChat);

      setInterval(tryToClaimStudent, 10);
    });
  };

  return {
    start: start
  };
}
