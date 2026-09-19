# Space Drift - Android Build & Packaging Automation
param(
    [switch]$Install,
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$AndroidDir = Join-Path $ProjectRoot 'android'
$SrcDir = Join-Path $ProjectRoot 'src'
$AssetsTarget = Join-Path $AndroidDir 'app\src\main\assets'

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " 🚀 SPACE DRIFT: ANDROID BUILD & PACKAGER " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Sync game assets from src/ to android assets
Write-Host "[1/3] Menyinkronkan aset game (src/ -> android assets)..." -ForegroundColor Yellow
if (Test-Path $AssetsTarget) {
    Remove-Item $AssetsTarget -Recurse -Force
}
New-Item -ItemType Directory -Path $AssetsTarget -Force | Out-Null
Copy-Item "$SrcDir\*" -Destination $AssetsTarget -Recurse -Force
Write-Host " -> Aset berhasil disinkronkan!" -ForegroundColor Green

# 2. Build Debug APK via Gradle
Write-Host "[2/3] Mengompilasi APK Debug dengan Gradle..." -ForegroundColor Yellow
Push-Location $AndroidDir

try {
    if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
        if (Test-Path "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot") {
            $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
        } elseif (Test-Path "C:\Program Files\Android\Android Studio\jbr") {
            $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
        }
    }

    $gradleCmd = ".\gradlew.bat"
    if ($Clean) {
        & $gradleCmd clean
    }

    & $gradleCmd assembleDebug

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Kompilasi Gradle gagal dengan kode exit $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

# 3. Locate generated APK
$ApkPath = Join-Path $AndroidDir 'app\build\outputs\apk\debug\app-debug.apk'
if (Test-Path $ApkPath) {
    $apkItem = Get-Item $ApkPath
    $ApkSizeMb = [math]::Round($apkItem.Length / 1MB, 2)
    Write-Host "[3/3] Kompilasi SUKSES!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "APK Debug Terbentuk:" -ForegroundColor White
    Write-Host ("   Path : " + $ApkPath) -ForegroundColor Cyan
    Write-Host ("   Size : " + $ApkSizeMb + " MB") -ForegroundColor White
    Write-Host "==========================================" -ForegroundColor Cyan

    if ($Install) {
        $adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
        if (Test-Path $adb) {
            Write-Host "Menginstal ke perangkat yang terhubung..." -ForegroundColor Yellow
            & $adb install -r $ApkPath
        } else {
            Write-Host "adb tidak ditemukan di $adb" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "File APK tidak ditemukan di $ApkPath" -ForegroundColor Red
}
