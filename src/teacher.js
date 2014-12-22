var faye    = require('faye');

module.exports = function(options) {
  var url    = options.url;
  var client = new faye.Client(url);

  var start = function(id) {
    var messageCount    = 0;
    var claimedStudents = 0;

    var connect = function() {
      client.publish('/presence/teacher/connect', {
        userId: id,
        role:   'teacher'
      });
    };

    var claimStudent = function() {
      client.publish('/presence/claim_student', {
        teacherId: id
      });
    };

    var sendNextMessage = function(channel) {
      client.publish(channel, {
        message: 'Message from teacher: ' + ++messageCount
      });
    };

    client.subscribe('/presence/status', function(data) {
      if(data.students.waiting > 0 && claimedStudents < options.studentsPerTeacher) {
        claimStudent();
      }
    });

    client.subscribe('/presence/new_chat/teacher/' + id, function(data) {
      var sendChannel = data.sendChannel;

      claimedStudents++;
      console.log('Teacher now has ' + claimedStudents + ' students.');

      var chatSub = client.subscribe(data.receiveChannel, function(data) {
        console.log('teacher got chat message', data);

        if(messageCount < options.messageCount) {
          sendNextMessage(sendChannel);
        }
        else {
          chatSub.cancel();
          claimedStudents--;
          console.log('Done');
        }
      });

      // kick off the whole shebang
      sendNextMessage(sendChannel);
    });

    connect();
  };

  return {
    start: start
  }
};
