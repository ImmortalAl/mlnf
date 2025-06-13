# Start development server for MLNF
cd front
Write-Host "Starting development server on http://localhost:8080" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
python -m http.server 8080 