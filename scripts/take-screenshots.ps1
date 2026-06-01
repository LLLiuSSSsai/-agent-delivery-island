$screenshotDir = "E:\Code\ShanAgent\agent-delivery-island\screenshots"
$stateFile = "$env:USERPROFILE\.claude\agent-state.json"

# Ensure screenshot directory exists
New-Item -ItemType Directory -Force -Path $screenshotDir | Out-Null

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Island is at top center of screen, ~520px wide, ~420px max height
# Capture a wide enough area to include all states
function Take-Screenshot($filename, $description) {
    Write-Host "Taking screenshot: $description"
    Start-Sleep -Milliseconds 800

    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    $screenWidth = $screen.Bounds.Width

    # Capture top-center area: all island states appear here
    # Width: 600px (covers max 520px expanded), Height: 450px (covers max 420px)
    $captureWidth = 600
    $captureHeight = 450
    $x = [Math]::Max(0, ($screenWidth - $captureWidth) / 2)
    $y = 0

    $bitmap = New-Object System.Drawing.Bitmap $captureWidth, $captureHeight
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($x, $y, 0, 0, (New-Object System.Drawing.Size $captureWidth, $captureHeight))

    $filepath = Join-Path $screenshotDir $filename
    $bitmap.Save($filepath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()

    Write-Host "  Saved: $filepath"
}

# Helper to write state
function Write-State($json) {
    $json | Out-File -FilePath $stateFile -Encoding utf8 -NoNewline
}

# --- IDLE ---
Write-State '{"status":"idle","task":"","command":"","details":"","requestId":"","timestamp":'$(Get-Date -UFormat %s000)',"elapsed":"00:00","toolType":"","toolLabel":""}'
Take-Screenshot "01-idle.png" "Idle state"

# --- DELIVERING ---
Write-State '{"status":"delivering","task":"Agent 正在分析项目结构...","command":"ls -la","details":"正在执行命令...","requestId":"","timestamp":'$(Get-Date -UFormat %s000)',"elapsed":"00:23","toolType":"","toolLabel":""}'
Take-Screenshot "02-delivering.png" "Delivering state"

# --- CONFIRM ---
Write-State '{"status":"confirm","task":"Claude Code 请求执行命令","command":"npm install react-router-dom","details":"该操作将在当前项目安装依赖包","requestId":"req-12345","timestamp":'$(Get-Date -UFormat %s000)',"elapsed":"00:45","toolType":"Bash","toolLabel":"npm install"}'
Take-Screenshot "03-confirm.png" "Confirm state"

# --- COMPLETE ---
Write-State '{"status":"complete","task":"订单已完成","command":"","details":"","requestId":"","timestamp":'$(Get-Date -UFormat %s000)',"elapsed":"00:00","toolType":"","toolLabel":""}'
Take-Screenshot "04-complete.png" "Complete state"

# Reset to idle
Write-State '{"status":"idle","task":"","command":"","details":"","requestId":"","timestamp":'$(Get-Date -UFormat %s000)',"elapsed":"00:00","toolType":"","toolLabel":""}'

Write-Host ""
Write-Host "All screenshots captured!"
