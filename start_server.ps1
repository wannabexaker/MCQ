param(
  [int]$Port = 8000
)

Set-Location -LiteralPath $PSScriptRoot

Write-Host "Starting local server on http://localhost:$Port"
Write-Host "Stop with Ctrl+C"

try {
  python -m http.server $Port
  exit 0
} catch {
  try {
    py -3 -m http.server $Port
    exit 0
  } catch {
    Write-Host "Python was not found. Install Python 3, then run: python -m http.server 8000"
    exit 1
  }
}

