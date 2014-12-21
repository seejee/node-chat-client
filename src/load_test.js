module.exports = function(options) {
  var url = options.url;

  var faye    = require('faye');
  var teacher = new faye.Client(url);
  var student = new faye.Client(url);

  teacher.bind('transport:down', function() {
    console.log('Disconnected.');
  });

  teacher.bind('transport:up', function() {
    console.log('Connected.');
  });

  //grab a student
  //go into a private channel
  //send messages
  //leave
  //limit students per teacher

  var teacherId = 1;

  teacher.subscribe('/presence/status', function(data) {
    if(data.students.waiting > 0) {
      teacher.publish('/presence/claim_student', {
        teacherId: teacherId
      });
    }
  });

  teacher.subscribe('/presence/new_chat/teacher/' + teacherId, function(data) {
    console.log('initiate chat', data);
  });

  teacher.publish('/presence/teacher/connect', {
    userId: teacherId,
    role:   'teacher'
  });

  //student
  //connect
  //wait for teacher to grab student
  //go into a private channel
  //send messages
  //leave

  var studentId = 100;

  student.subscribe('/presence/new_chat/student/' + studentId, function(data) {
    console.log('student', data);
  });

  student.publish('/presence/student/connect', {
    userId: studentId,
    role:   'student'
  });
}
