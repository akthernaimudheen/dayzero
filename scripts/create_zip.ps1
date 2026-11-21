# PowerShell script to create clean portable zip of DayZero using staging folder and Compress-Archive
param(
    [string]$Destination = "C:\Users\akthe\Downloads\DayZero-App.zip"
)

$sourceDir = "C:\Users\akthe\Downloads\dayzero"
$stageDir = "C:\Users\akthe\Downloads\dayzero_staging"

if (Test-Path $stageDir) {
    Remove-Item -Recurse -Force $stageDir
}
if (Test-Path $Destination) {
    Remove-Item -Force $Destination
}

New-Item -ItemType Directory -Path $stageDir | Out-Null

$excludePatterns = @(
    "\node_modules\",
    "\.next\",
    "\.expo\",
    "\backups\",
    "\.git\",
    "\.gradle\",
    "\android\app\build\",
    "\android\.gradle\"
)

$allFiles = Get-ChildItem -Path $sourceDir -Recurse -File

$count = 0
foreach ($file in $allFiles) {
    $full = $file.FullName
    $skip = $false
    foreach ($p in $excludePatterns) {
        if ($full.Contains($p)) {
            $skip = $true
            break
        }
    }
    if (-not $skip) {
        $rel = $full.Substring($sourceDir.Length + 1)
        $targetFile = Join-Path $stageDir $rel
        $targetParent = Split-Path $targetFile -Parent
        if (-not (Test-Path $targetParent)) {
            New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
        }
        Copy-Item -Path $full -Destination $targetFile
        $count++
    }
}

Write-Host "Staged $count files. Compressing to $Destination..."
Compress-Archive -Path "$stageDir\*" -DestinationPath $Destination -CompressionLevel Optimal

Remove-Item -Recurse -Force $stageDir

$zipInfo = Get-Item $Destination
$sizeMb = [math]::Round($zipInfo.Length / 1MB, 2)
Write-Host "SUCCESS: Created $Destination ($sizeMb MB) with $count files."
