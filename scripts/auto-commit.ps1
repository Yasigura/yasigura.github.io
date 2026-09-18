# Следит за папкой проекта и сам коммитит изменения после сохранения файла.
# Запуск: powershell -ExecutionPolicy Bypass -File scripts\auto-commit.ps1
# Остановка: Ctrl+C в этом окне.

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoRoot
$watcher.IncludeSubdirectories = $true
$watcher.Filter = "*.*"
$watcher.NotifyFilter = [System.IO.NotifyFilters]'LastWrite, FileName, DirectoryName'

$pending = $false
$lastChange = Get-Date

$action = {
    $script:pending = $true
    $script:lastChange = Get-Date
}
Register-ObjectEvent $watcher 'Changed' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Created' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Deleted' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Renamed' -Action $action | Out-Null
$watcher.EnableRaisingEvents = $true

Write-Host "Слежу за $repoRoot — сохраняй файлы как обычно, коммиты будут сами."

while ($true) {
    Start-Sleep -Seconds 1
    if ($pending -and ((Get-Date) - $lastChange).TotalSeconds -ge 3) {
        $pending = $false
        $status = git status --porcelain
        if ($status) {
            git add -A
            $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
            git commit -m "Автосохранение $stamp" | Out-Null
            git push | Out-Null
            Write-Host "Закоммитил и запушил: $stamp"
        }
    }
}
