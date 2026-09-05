@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "c:\Users\HP\OneDrive\Desktop\unlimited tokens"
"C:\Program Files\nodejs\node.exe" --import ./node_modules/tsx/dist/loader.mjs --input-type=module -e "await import('./server/src/index.ts')" > server.log 2>&1
