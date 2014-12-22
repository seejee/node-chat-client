var faye    = require('faye');

module.exports = function(options) {
  var url = options.url;

  var start = function(id) {
    var client       = new faye.Client(url);
    var messageCount = 0;

    client.subscribe('/presence/new_chat/student/' + id, function(data) {
      var sendChannel = data.sendChannel;
      console.log('Student ' + id + ' is starting new chat.');

      var chatSub = client.subscribe(data.receiveChannel, function(data) {
        console.log('student got chat message', data);

        client.publish(sendChannel, {
          message: 'Message from student: ' + ++messageCount
        });
      });
    });

    client.publish('/presence/student/connect', {
      userId: id,
      role:   'student'
    });
  }

  return {
    start: start
  };
}
