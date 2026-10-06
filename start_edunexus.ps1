Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "       STARTING EDUNEXUS SERVICES" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Start Backend
Write-Host "Starting FastAPI Backend Engine on Port 8000..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn main:app --reload --port 8000"

# Wait briefly
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Vite React Frontend on Port 8080..." -ForegroundColor Blue
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Services are launching in new windows."
Write-Host "Backend API: http://localhost:8000/docs"
Write-Host "Frontend App: http://localhost:8080"
Write-Host "Press any key to stop all services..." -ForegroundColor Yellow
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "Stopping services..." -ForegroundColor Red
Stop-Process -Name "node" -ErrorAction SilentlyContinue
Stop-Process -Name "python" -ErrorAction SilentlyContinue
Write-Host "Stopped." -ForegroundColor Green
