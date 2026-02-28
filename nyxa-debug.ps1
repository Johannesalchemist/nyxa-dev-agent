Write-Host "`n=== HEAD ==="
git rev-parse HEAD

Write-Host "`n=== STATUS ==="
git status

Write-Host "`n=== LOG ==="
git log --oneline -n 5
