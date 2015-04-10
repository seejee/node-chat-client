var io = require('socket.io-client');
var totalMessageCount = 0;

module.exports = function(options) {
  var start = function(url, id, done) {
    var client = io(url, {transports: ['websocket']});
    var publish    = function(event, data) { client.emit(event, data); };

    var subscribe  = function(event, cb)   {
      client.on(event, function(data) {
        totalMessageCount++;
        cb(data);
      });
    };

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
        done();
      }
    };

    var tryToClaimStudent = function() {
      if(claimedStudents < 5 && (lastStats == null || lastStats.students.waiting > 0)) {
        //console.log('teacher ' + id + ' is asking for another kid. They have ' + claimedStudents + ' kids.')
        publish('presence:claim_student', { teacherId: id })
      }
    };

    var messageCount = function(chatId) {
      if(messageCounts[chatId] === undefined) {
        messageCounts[chatId] = 0;
      }

      return messageCounts[chatId];
    }

    var handleNewChat = function(chat) {
      var sendNextMessage = function(channel) {
        var chatId = chat.id
        var count  = messageCount(chatId) + 1;
        messageCounts[chatId] = count;

        publish(channel, {
          chatId:  chatId,
          message: 'Message from teacher: ' + count
        });
      };

      var sendChannel      = chat.sendChannel;
      var receiveChannel   = chat.receiveChannel;
      var terminateChannel = chat.terminateChannel;
      var terminatedChannel = chat.terminatedChannel;
      var joinedChannel    = chat.joinedChannel;
      var readyChannel     = chat.readyChannel;
      var hasTerminated    = false;

      claimedStudents++;
      console.log('Teacher now has ' + claimedStudents + ' students.');

      subscribe(receiveChannel, function(data) {
        //console.log('Teacher got chat message:', data);

        if(messageCount(chat.id) < options.messageCount) {
          sendNextMessage(sendChannel);
        }
        else if(!hasTerminated) {
          hasTerminated = true;
          publish(terminateChannel, {
            chatId:  chat.id,
            message: 'teacher is ending the chat.'
          });
        }
      });

      //wait for student to join
      subscribe(readyChannel, function(data) {
        // kick off the whole shebang
        sendNextMessage(sendChannel);
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
    setInterval(tryToClaimStudent, 700);
  };

  return {
    start: start
  }
};
