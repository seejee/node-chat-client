var Phoenix = require('../../vendor/phoenix');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var socket = new Phoenix.Socket(url);

    socket.join("presence", "global", {userId: id, role: 'student'}, function(channel) {
      console.log("student connected");
    });
  };

  return {
    start: start
  };
}
