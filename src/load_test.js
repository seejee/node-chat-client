module.exports = function(options) {
  var url = options.url;

  var faye    = require('faye');
  var teacher = new faye.Client(url);
  var student = new faye.Client(url);

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
    console.log('Teacher is starting new chat.');

    teacher.subscribe(data.receiveChannel, function(data) {
      console.log('teacher got chat message', data);
    });

    teacher.publish(data.sendChannel, {
      message: 'Hello from teacher'
    });
  });

  teacher.publish('/presence/teacher/connect', {
    userId: teacherId,
    role:   'teacher'
  });

  //leave

  var studentId = 100;

  student.subscribe('/presence/new_chat/student/' + studentId, function(data) {
    console.log('Student is starting new chat.');

    var chatSub = student.subscribe(data.receiveChannel, function(data) {
      console.log('student got chat message', data);
    });

    student.publish(data.sendChannel, {
      message: 'Hello from student'
    });
  });

  student.publish('/presence/student/connect', {
    userId: studentId,
    role:   'student'
  });
}
