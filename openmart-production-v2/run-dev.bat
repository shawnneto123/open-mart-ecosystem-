@echo off
echo 🚀 Launching Open Mart Production Mobile App Dev Server...
echo 📂 Moving into subfolder: openmart-production
cd /d "%~dp0openmart-production"
if not exist package.json (
    echo ❌ Error: Could not find package.json in %CD%
    pause
    exit /b
)
echo ⚙️ Starting dev server...
call npm run dev
