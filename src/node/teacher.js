var faye    = require('faye');

module.exports = function(options) {
  var url    = options.url;
  var client = new faye.Client(url);

  var start = function(id) {
    var messageCounts   = {};
    var claimedStudents = 0;
    var lastStats       = null;

    var connect = function() {
      return client.publish('/presence/teacher/connect', {
        userId: id,
        role:   'teacher'
      });
    };

    var onStatusUpdate = function(data) {
      lastStats = data;

      if(data.students.waiting == 0 && data.students.total == 0) {
        process.exit();
      }
    };

    var tryToClaimStudent = function() {
      if(claimedStudents < 5 && (lastStats == null || lastStats.students.waiting > 0)) {
        client.publish('/presence/claim_student', { teacherId: id })
      }
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

    var handleNewChat = function(data) {
      var sendChannel      = data.sendChannel;
      var receiveChannel   = data.receiveChannel;
      var terminateChannel = data.terminateChannel;
      var terminatedChannel = data.terminatedChannel;
      var joinedChannel    = data.joinedChannel;
      var readyChannel     = data.readyChannel;

      claimedStudents++;
      console.log('Teacher now has ' + claimedStudents + ' students.');

      var chatSub = client.subscribe(receiveChannel, function(data) {
        //console.log('Teacher got chat message:', data);

        if(messageCount(sendChannel) < options.messageCount) {
          sendNextMessage(sendChannel);
        }
        else {
          client.publish(terminateChannel, {
            message: 'teacher is ending the chat.'
          });
        }
      });

      //wait for student to join
      var readySub = client.subscribe(readyChannel, function(data) {
        // kick off the whole shebang
        sendNextMessage(sendChannel);
      });

      var terminatedSub = client.subscribe(terminatedChannel, function(data) {
        chatSub.cancel();
        readySub.cancel();
        terminatedSub.cancel();

        claimedStudents--;
        console.log('Teacher now has ' + claimedStudents + ' students.');
        tryToClaimStudent();
      })

      chatSub
        .then(readySub)
        .then(terminatedSub)
        .then(function() {
          client.publish(joinedChannel, { userId: id });
        });
    };

    client
      .subscribe('/presence/status', onStatusUpdate)
      .then(function() {
        return client.subscribe('/presence/new_chat/teacher/' + id, handleNewChat);
      })
      .then(connect)
      .then(function() {
        setInterval(tryToClaimStudent, 10);
      });
  };

  return {
    start: start
  }
};
