# Ejecuta la app Android con ANDROID_HOME y adb en PATH
# Ejecutar: .\scripts\android-dev.ps1
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
Set-Location $PSScriptRoot\..
npx react-native run-android
