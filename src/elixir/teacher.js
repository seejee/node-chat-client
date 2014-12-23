var Phoenix = require('../../vendor/phoenix');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var socket = new Phoenix.Socket(url);

    socket.join("presence", "global", {userId: id, role: 'teacher'}, function(channel) {
      console.log("teacher connected");

      var tryToClaimStudent = function(data) {
        console.log(data);
        if(data.students.waiting > 0) {
          channel.send('claim:student', {
            teacherId: id
          });
        }
      };

      channel.on("user:status", function(data) {
        tryToClaimStudent(data);
      });
    });
  };

  return {
    start: start
  };
}

