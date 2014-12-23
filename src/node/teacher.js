var faye    = require('faye');

module.exports = function(options) {
  var url    = options.url;
  var client = new faye.Client(url);

  var start = function(id) {
    var messageCounts   = {};
    var claimedStudents = 0;

    var connect = function() {
      client.publish('/presence/teacher/connect', {
        userId: id,
        role:   'teacher'
      });
    };

    var tryToClaimStudent = function(data) {
      if(data.students.waiting == 0 && data.students.total == 0) {
        process.exit();
      }

      if(data.students.waiting > 0) {
        claimStudent();
      }
    };

    var claimStudent = function() {
      client.publish('/presence/claim_student', {
        teacherId: id
      });
    };

    var messageCount = function(channel) {
      if(messageCounts[channel] === undefined) {
        messageCounts[channel] = 0;
      }

      return messageCounts[channel];
    }

    var sendNextMessage = function(channel, count) {
      count = messageCount(channel) + 1;
      messageCounts[channel] = count;

      client.publish(channel, {
        message: 'Message from teacher: ' + count
      });
    };

    var terminateChat = function(channel) {
      client.publish(channel, {
        message: 'Teacher is ending the chat.'
      });
    };

    var handleNewChat = function(data) {
      var sendChannel      = data.sendChannel;
      var receiveChannel   = data.receiveChannel;
      var terminateChannel = data.terminateChannel;
      var joinedChannel    = data.joinedChannel;

      claimedStudents++;
      console.log('Teacher now has ' + claimedStudents + ' students.');

      var chatSub = client.subscribe(receiveChannel, function(data) {
        //console.log('Teacher got chat message:', data);

        if(messageCount(sendChannel) < options.messageCount) {
          sendNextMessage(sendChannel);
        }
        else {
          claimedStudents--;
          console.log('Teacher now has ' + claimedStudents + ' students.');

          chatSub.cancel();
          joinedSub.cancel();
          terminateChat(terminateChannel);
        }
      });

      //wait for student to join
      var joinedSub = client.subscribe(joinedChannel, function(data) {
        // kick off the whole shebang
        sendNextMessage(sendChannel);
      });
    };

    client
      .subscribe('/presence/status', tryToClaimStudent)
      .then(function() {
        client.subscribe('/presence/new_chat/teacher/' + id, handleNewChat)
      })
      .then(function() {
        connect();
      });
  };

  return {
    start: start
  }
};
