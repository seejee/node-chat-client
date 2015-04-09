#!/bin/bash

pids=()
mode=ping
numTeachers=1
numStudents=0

#for studentId in $(seq $(expr $numStudents - 1)); do
#  node bin/chatClient --mode $mode --numStudents 1 --numTeachers 0 --idStart $studentId &
#  pids+=($!)
#done

for teacherId in $(seq $(expr $numTeachers - 1)); do
  node bin/chatClient --mode $mode --numStudents 0 --numTeachers 1 --idStart $teacherId &
  pids+=($!)
done

time wait ${pidArr[@]}
