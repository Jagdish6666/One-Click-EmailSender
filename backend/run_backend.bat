@echo off
cd /d "c:\Users\asus\Downloads\Spring-Email_Sender\backend"
java -jar target\certificates-0.0.1-SNAPSHOT.jar > run_backend_output.log 2>&1
echo Exit code: %ERRORLEVEL% >> run_backend_output.log
