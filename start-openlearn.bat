@echo off
cd /d "%~dp0"
echo Starting OpenLearn local server...
echo Keep this window open while using the contact form.
node server.js
pause
