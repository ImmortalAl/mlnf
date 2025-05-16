# Simple HTTP Server for Local Testing
$port = 8000
$url = "http://localhost:$port/"

# Check if port is available
$portInUse = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) -ne $null

if ($portInUse) {
    Write-Host "Port $port is already in use. Please close the application using this port and try again." -ForegroundColor Red
    exit
}

# Start the web server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host "Server started at $url" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "Available files:" -ForegroundColor Cyan
Write-Host "- $url" -ForegroundColor Cyan
Write-Host "- ${url}local-test.html" -ForegroundColor Cyan
Write-Host "- ${url}pages/api-test.html" -ForegroundColor Cyan
Write-Host ""

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $requestUrl = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($requestUrl) -or $requestUrl -eq "/") {
            $requestUrl = "index.html"
        }
        
        $filePath = Join-Path $PSScriptRoot $requestUrl
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 - File not found: $requestUrl")
            $response.ContentLength64 = $notFound.Length
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        
        $response.Close()
        
        $status = $response.StatusCode
        $method = $request.HttpMethod
        Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $method ${requestUrl} - $status"
    }
}
finally {
    $listener.Stop()
    Write-Host "\nServer stopped" -ForegroundColor Yellow
}
