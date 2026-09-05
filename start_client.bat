@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "c:\Users\HP\OneDrive\Desktop\unlimited tokens"
"C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js client > client.log 2>&1
