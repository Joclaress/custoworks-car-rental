Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = Join-Path (Get-Location) "custoworks-website.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$distDir = Join-Path (Get-Location) "client\dist"
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $distDir -Recurse -File | ForEach-Object {
    $fullName = $_.FullName
    $rel = $fullName.Substring($distDir.Length + 1).Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullName, $rel) | Out-Null
}

$zip.Dispose()
Write-Host "Zip successfully created with Linux forward slashes!"
