var io    = require('socket.io-client');

module.exports = function(options) {
  var url    = options.url;

  var start = function(id) {
    var socket = io(url, {multiplex: false})
    var ready = false;

    var messageCounts   = {};
    var claimedStudents = 0;
    var lastStats       = null;

    var onReady = function() {
      if(ready) {
        console.log('already ready');
        return;
      }

      ready = true;
      console.log('connected');

      socket.emit('/presence/teacher/connect', {
        userId: id,
        role:   'teacher'
      });

      tryToClaimStudent();
    };

    var onStatusUpdate = function(data) {
      lastStats = data;

      if(data.students.waiting == 0 && data.students.total == 0) {
        process.exit();
      }
    };

    var tryToClaimStudent = function() {
      if(claimedStudents < 5 && (lastStats == null || lastStats.students.waiting > 0)) {
        socket.emit('/presence/claim_student', { teacherId: id });

        setImmediate(tryToClaimStudent);
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

      socket.emit(channel, {
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

      socket.on(receiveChannel, function(data) {
        if(messageCount(sendChannel) < options.messageCount) {
          sendNextMessage(sendChannel);
        }
        else {
          socket.emit(terminateChannel, {
            message: 'teacher is ending the chat.'
          });
        }
      });

      //wait for student to join
      socket.on(readyChannel, function(data) {
        // kick off the whole shebang
        sendNextMessage(sendChannel);
      });

      socket.on(terminatedChannel, function(data) {
        claimedStudents--;
        console.log('Teacher now has ' + claimedStudents + ' students.');
        tryToClaimStudent();
      })

      socket.emit(joinedChannel, { userId: id });
    };

    socket.on('/presence/new_chat/teacher/' + id, handleNewChat);
    socket.on('/presence/status', onStatusUpdate);
    socket.on('/presence/ready', onReady);
  };

  return {
    start: start
  }
};
