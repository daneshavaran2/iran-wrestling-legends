# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 اسکریپت Deploy موزه کشتی ایران (Windows PowerShell)
# Iran Wrestling Museum Deployment Script
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# تنظیمات
$BuildDir = "build"

# ═══════════════════════════════════════════════════════════════════════════════
# توابع کمکی
# ═══════════════════════════════════════════════════════════════════════════════

function Write-Step {
    param([string]$Message)
    Write-Host "`n▶ $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    exit 1
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════════════════════
# نمایش لوگو
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║                 🏆 موزه کشتی ایران - Deploy                       ║" -ForegroundColor Yellow
Write-Host "║              Iran Wrestling Museum Deployment                     ║" -ForegroundColor Yellow
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# بررسی پیش‌نیازها
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step "بررسی پیش‌نیازها..."

# بررسی Node.js
try {
    $nodeVersion = node -v
    Write-Success "Node.js: $nodeVersion"
} catch {
    Write-Error "Node.js نصب نیست. لطفاً اول Node.js را نصب کنید."
}

# بررسی npm
try {
    $npmVersion = npm -v
    Write-Success "npm: $npmVersion"
} catch {
    Write-Error "npm نصب نیست."
}

# ═══════════════════════════════════════════════════════════════════════════════
# نصب Dependencies
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step "نصب dependencies..."
npm ci --silent 2>$null
if ($LASTEXITCODE -ne 0) {
    npm install --silent
}
Write-Success "Dependencies نصب شدند"

# ═══════════════════════════════════════════════════════════════════════════════
# Build پروژه
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step "ساخت پروژه (Production Build)..."

# پاک کردن build قبلی
if (Test-Path $BuildDir) {
    Remove-Item -Recurse -Force $BuildDir
}

# Build
npm run build

if (Test-Path $BuildDir) {
    $size = (Get-ChildItem -Recurse $BuildDir | Measure-Object -Property Length -Sum).Sum / 1MB
    $fileCount = (Get-ChildItem -Recurse $BuildDir -File).Count
    Write-Success "Build موفقیت‌آمیز: $BuildDir/"
    Write-Host "    حجم: $([math]::Round($size, 2)) MB"
    Write-Host "    تعداد فایل: $fileCount"
} else {
    Write-Error "پوشه $BuildDir ایجاد نشد!"
}

# ═══════════════════════════════════════════════════════════════════════════════
# منوی انتخاب روش Deploy
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "`nروش Deploy را انتخاب کنید:" -ForegroundColor Cyan
Write-Host "  1) ZIP - ایجاد آرشیو برای آپلود دستی"
Write-Host "  2) SCP - آپلود به سرور (نیاز به OpenSSH)"
Write-Host "  3) Liara - Deploy به Liara.ir"
Write-Host "  4) فقط Build (بدون آپلود)"
Write-Host "  0) خروج"
Write-Host ""

$choice = Read-Host "انتخاب شما (0-4)"

switch ($choice) {
    "1" {
        # ایجاد آرشیو ZIP
        Write-Step "ایجاد آرشیو ZIP..."
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $archiveName = "wrestling-museum-$timestamp.zip"
        
        Compress-Archive -Path "$BuildDir\*" -DestinationPath $archiveName -Force
        
        $archiveSize = (Get-Item $archiveName).Length / 1MB
        Write-Success "آرشیو ایجاد شد: $archiveName"
        Write-Host "    حجم: $([math]::Round($archiveSize, 2)) MB"
        Write-Host ""
        Write-Host "فایل ZIP آماده آپلود به سرور است." -ForegroundColor Green
    }
    "2" {
        # آپلود با SCP
        Write-Step "آپلود به سرور با SCP..."
        
        $serverHost = Read-Host "  Host (مثال: server.example.com)"
        $serverUser = Read-Host "  User (مثال: root)"
        $serverPath = Read-Host "  Path (مثال: /var/www/museum)"
        
        scp -r "$BuildDir\*" "${serverUser}@${serverHost}:${serverPath}/"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "فایل‌ها با موفقیت آپلود شدند!"
        } else {
            Write-Error "خطا در آپلود فایل‌ها"
        }
    }
    "3" {
        # Deploy به Liara
        Write-Step "آپلود به Liara..."
        
        # بررسی Liara CLI
        try {
            liara --version | Out-Null
        } catch {
            Write-Warning "Liara CLI نصب نیست. در حال نصب..."
            npm install -g @liara/cli
        }
        
        # ایجاد liara.json
        if (-not (Test-Path "liara.json")) {
            @{
                platform = "static"
                app = "wrestling-museum"
                build = @{
                    folder = "build"
                }
            } | ConvertTo-Json | Out-File "liara.json" -Encoding UTF8
            Write-Success "فایل liara.json ایجاد شد"
        }
        
        liara deploy
        
        Write-Success "Deploy به Liara انجام شد!"
    }
    "4" {
        Write-Success "Build انجام شد. فایل‌ها در پوشه $BuildDir/ آماده هستند."
    }
    "0" {
        exit 0
    }
    default {
        Write-Error "انتخاب نامعتبر"
    }
}

# پیام نهایی
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ عملیات با موفقیت انجام شد!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
