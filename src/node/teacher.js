var io = require('socket.io-client');
var totalMessageCount = 0;

module.exports = function(options) {
  var url    = options.url;
  var client = io(url);
  var publish    = function(event, data) { client.emit(event, data); };
  var subscribe  = function(event, cb)   { client.on(event, cb); };

  var start = function(id) {
    var messageCounts   = {};
    var claimedStudents = 0;
    var lastStats       = null;

    var connect = function() {
      publish('presence:teacher:connect', {
        userId: id,
        role:   'teacher'
      });
    };

    var onStatusUpdate = function(data) {
      lastStats = data;

      if(data.students.waiting == 0 && data.students.total == 0) {
        console.log('teachers received ' + totalMessageCount + ' messages.');
        process.exit();
      }
    };

    var tryToClaimStudent = function() {
      if(claimedStudents < 5 && (lastStats == null || lastStats.students.waiting > 0)) {
        publish('presence:claim_student', { teacherId: id })
      }
    };

    var messageCount = function(chatId, channel) {
      if(messageCounts[chatId + channel] === undefined) {
        messageCounts[chatId + channel] = 0;
      }

      return messageCounts[chatId + channel];
    }

    var sendNextMessage = function(chatId, channel) {
      var count = messageCount(chatId, channel) + 1;
      messageCounts[chatId + channel] = count;

      publish(channel, {
        chatId:  chatId,
        message: 'Message from teacher: ' + count
      });
    };

    var handleNewChat = function(chat) {
      var sendChannel      = chat.sendChannel;
      var receiveChannel   = chat.receiveChannel;
      var terminateChannel = chat.terminateChannel;
      var terminatedChannel = chat.terminatedChannel;
      var joinedChannel    = chat.joinedChannel;
      var readyChannel     = chat.readyChannel;

      claimedStudents++;
      console.log('Teacher now has ' + claimedStudents + ' students.');

      subscribe(receiveChannel, function(data) {
        totalMessageCount++;
        //console.log('Teacher got chat message:', data);

        if(messageCount(chat.id, sendChannel) < options.messageCount) {
          sendNextMessage(chat.id, sendChannel);
        }
        else {
          publish(terminateChannel, {
            chatId:  chat.id,
            message: 'teacher is ending the chat.'
          });
        }
      });

      //wait for student to join
      subscribe(readyChannel, function(data) {
        // kick off the whole shebang
        sendNextMessage(chat.id, sendChannel);
      });

      subscribe(terminatedChannel, function(data) {
        claimedStudents--;
        console.log('Teacher now has ' + claimedStudents + ' students.');
        tryToClaimStudent();
      })

      publish(joinedChannel, { chatId: chat.id, userId: id });
    };

    client.on('connect_error', function(data) {
      console.log('teacher connection error: ', data);
    });

    subscribe('presence:status', onStatusUpdate);
    subscribe('presence:new_chat:teacher:' + id, handleNewChat);
    connect();
    setInterval(tryToClaimStudent, 10);
  };

  return {
    start: start
  }
};
