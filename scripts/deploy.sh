#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 اسکریپت Deploy موزه کشتی ایران
# Iran Wrestling Museum Deployment Script
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# رنگ‌های ترمینال
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# لوگو
echo -e "${YELLOW}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                 🏆 موزه کشتی ایران - Deploy                       ║"
echo "║              Iran Wrestling Museum Deployment                     ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# تنظیمات پیش‌فرض
BUILD_DIR="build"
DEPLOY_METHOD=""
SERVER_HOST=""
SERVER_USER=""
SERVER_PATH=""

# ═══════════════════════════════════════════════════════════════════════════════
# توابع کمکی
# ═══════════════════════════════════════════════════════════════════════════════

print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# بررسی پیش‌نیازها
# ═══════════════════════════════════════════════════════════════════════════════

check_prerequisites() {
    print_step "بررسی پیش‌نیازها..."
    
    # بررسی Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js نصب نیست. لطفاً اول Node.js را نصب کنید."
    fi
    print_success "Node.js: $(node -v)"
    
    # بررسی npm
    if ! command -v npm &> /dev/null; then
        print_error "npm نصب نیست."
    fi
    print_success "npm: $(npm -v)"
}

# ═══════════════════════════════════════════════════════════════════════════════
# نصب Dependencies
# ═══════════════════════════════════════════════════════════════════════════════

install_dependencies() {
    print_step "نصب dependencies..."
    npm ci --silent || npm install --silent
    print_success "Dependencies نصب شدند"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Build پروژه
# ═══════════════════════════════════════════════════════════════════════════════

build_project() {
    print_step "ساخت پروژه (Production Build)..."
    
    # پاک کردن build قبلی
    rm -rf "$BUILD_DIR"
    
    # Build
    npm run build
    
    if [ -d "$BUILD_DIR" ]; then
        print_success "Build موفقیت‌آمیز: $BUILD_DIR/"
        echo -e "    حجم: $(du -sh $BUILD_DIR | cut -f1)"
        echo -e "    تعداد فایل: $(find $BUILD_DIR -type f | wc -l)"
    else
        print_error "پوشه $BUILD_DIR ایجاد نشد!"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# Deploy به سرور با SCP
# ═══════════════════════════════════════════════════════════════════════════════

deploy_scp() {
    print_step "آپلود به سرور با SCP..."
    
    if [ -z "$SERVER_HOST" ] || [ -z "$SERVER_USER" ] || [ -z "$SERVER_PATH" ]; then
        echo "لطفاً اطلاعات سرور را وارد کنید:"
        read -p "  Host (مثال: server.example.com): " SERVER_HOST
        read -p "  User (مثال: root): " SERVER_USER
        read -p "  Path (مثال: /var/www/museum): " SERVER_PATH
    fi
    
    # آپلود فایل‌ها
    echo -e "\n  در حال آپلود به ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}..."
    
    scp -r "$BUILD_DIR"/* "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
    
    print_success "فایل‌ها با موفقیت آپلود شدند!"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Deploy به سرور با rsync
# ═══════════════════════════════════════════════════════════════════════════════

deploy_rsync() {
    print_step "آپلود به سرور با rsync..."
    
    if ! command -v rsync &> /dev/null; then
        print_error "rsync نصب نیست. لطفاً اول rsync را نصب کنید."
    fi
    
    if [ -z "$SERVER_HOST" ] || [ -z "$SERVER_USER" ] || [ -z "$SERVER_PATH" ]; then
        echo "لطفاً اطلاعات سرور را وارد کنید:"
        read -p "  Host (مثال: server.example.com): " SERVER_HOST
        read -p "  User (مثال: root): " SERVER_USER
        read -p "  Path (مثال: /var/www/museum): " SERVER_PATH
    fi
    
    echo -e "\n  در حال همگام‌سازی با ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}..."
    
    rsync -avz --delete --progress \
        "$BUILD_DIR"/ \
        "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
    
    print_success "فایل‌ها با موفقیت همگام‌سازی شدند!"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Deploy به Liara
# ═══════════════════════════════════════════════════════════════════════════════

deploy_liara() {
    print_step "آپلود به Liara..."
    
    if ! command -v liara &> /dev/null; then
        print_warning "Liara CLI نصب نیست. در حال نصب..."
        npm install -g @liara/cli
    fi
    
    # ایجاد liara.json اگر وجود ندارد
    if [ ! -f "liara.json" ]; then
        echo '{
  "platform": "static",
  "app": "wrestling-museum",
  "build": {
    "folder": "build"
  }
}' > liara.json
        print_success "فایل liara.json ایجاد شد"
    fi
    
    liara deploy
    
    print_success "Deploy به Liara انجام شد!"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Deploy به Docker Registry
# ═══════════════════════════════════════════════════════════════════════════════

deploy_docker() {
    print_step "ساخت و Push تصویر Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker نصب نیست."
    fi
    
    read -p "  نام تصویر (مثال: myregistry/museum): " DOCKER_IMAGE
    read -p "  تگ (مثال: latest): " DOCKER_TAG
    DOCKER_TAG=${DOCKER_TAG:-latest}
    
    # ایجاد Dockerfile موقت
    cat > Dockerfile.deploy << 'EOF'
FROM nginx:alpine
COPY build/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

    # ایجاد nginx.conf
    cat > nginx.conf << 'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
EOF

    docker build -t "${DOCKER_IMAGE}:${DOCKER_TAG}" -f Dockerfile.deploy .
    print_success "تصویر Docker ساخته شد"
    
    read -p "  Push به registry? (y/n): " PUSH_CONFIRM
    if [ "$PUSH_CONFIRM" = "y" ]; then
        docker push "${DOCKER_IMAGE}:${DOCKER_TAG}"
        print_success "تصویر Push شد"
    fi
    
    # پاک کردن فایل‌های موقت
    rm -f Dockerfile.deploy
}

# ═══════════════════════════════════════════════════════════════════════════════
# ایجاد آرشیو ZIP
# ═══════════════════════════════════════════════════════════════════════════════

create_archive() {
    print_step "ایجاد آرشیو ZIP..."
    
    ARCHIVE_NAME="wrestling-museum-$(date +%Y%m%d-%H%M%S).zip"
    
    cd "$BUILD_DIR"
    zip -r "../$ARCHIVE_NAME" .
    cd ..
    
    print_success "آرشیو ایجاد شد: $ARCHIVE_NAME"
    echo -e "    حجم: $(du -h $ARCHIVE_NAME | cut -f1)"
}

# ═══════════════════════════════════════════════════════════════════════════════
# منوی اصلی
# ═══════════════════════════════════════════════════════════════════════════════

show_menu() {
    echo -e "\n${BLUE}روش Deploy را انتخاب کنید:${NC}"
    echo "  1) SCP - آپلود مستقیم به سرور"
    echo "  2) rsync - همگام‌سازی با سرور (سریع‌تر)"
    echo "  3) Liara - Deploy به Liara.ir"
    echo "  4) Docker - ساخت و Push تصویر Docker"
    echo "  5) ZIP - فقط ایجاد آرشیو"
    echo "  6) فقط Build (بدون آپلود)"
    echo "  0) خروج"
    echo ""
    read -p "انتخاب شما (0-6): " choice
    
    case $choice in
        1) DEPLOY_METHOD="scp" ;;
        2) DEPLOY_METHOD="rsync" ;;
        3) DEPLOY_METHOD="liara" ;;
        4) DEPLOY_METHOD="docker" ;;
        5) DEPLOY_METHOD="zip" ;;
        6) DEPLOY_METHOD="build-only" ;;
        0) exit 0 ;;
        *) print_error "انتخاب نامعتبر" ;;
    esac
}

# ═══════════════════════════════════════════════════════════════════════════════
# اجرای اصلی
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    # بررسی پیش‌نیازها
    check_prerequisites
    
    # نصب dependencies
    install_dependencies
    
    # Build پروژه
    build_project
    
    # نمایش منو اگر روش مشخص نشده
    if [ -z "$DEPLOY_METHOD" ]; then
        show_menu
    fi
    
    # اجرای Deploy
    case $DEPLOY_METHOD in
        "scp")
            deploy_scp
            ;;
        "rsync")
            deploy_rsync
            ;;
        "liara")
            deploy_liara
            ;;
        "docker")
            deploy_docker
            ;;
        "zip")
            create_archive
            ;;
        "build-only")
            print_success "Build انجام شد. فایل‌ها در پوشه $BUILD_DIR/ آماده هستند."
            ;;
    esac
    
    # پیام نهایی
    echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ عملیات با موفقیت انجام شد!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}\n"
}

# اجرای اسکریپت
main "$@"
