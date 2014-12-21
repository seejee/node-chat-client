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

  //teacher
  //connect
  //wait for students to pop in the queue
  //grab a student
  //go into a private channel
  //send messages
  //leave

  teacher.publish('/presence/connect/teacher', {
      userId: 1,
      role:   'teacher'
  });

  //student
  //connect
  //wait for teacher to grab student
  //go into a private channel
  //send messages
  //leave

  student.publish('/presence/connect/student', {
      userId: 100,
      role:   'student'
  });

  teacher.subscribe('/presence/status', function(data) {
    console.log('teacher', data);
  });

  student.subscribe('/presence/status', function(data) {
    console.log('student', data);
  });
}
