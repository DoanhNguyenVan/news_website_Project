@echo off
chcp 65001 > nul
echo ===================================================
echo   DANG DAY DU AN NEWSPORTAL LEN GITHUB
echo ===================================================
echo.
cd /d "C:\Users\ADMIN\Downloads\newsportal\newsportal"

echo 1. Dong bo Remote GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/DoanhNguyenVan/news_website_Project.git
git branch -M main

echo.
echo 2. Dang day toan bo ma nguon len GitHub (DoanhNguyenVan/news_website_Project)...
echo (Neu co cua so dang nhap GitHub bat len, ban chi can bam Authorize)
echo.
git push -u origin main --force

echo.
echo ===================================================
if %ERRORLEVEL% EQU 0 (
    echo [THANH CONG] Toan bo ma nguon NewsPortal da duoc push len GitHub!
) else (
    echo [CO LOI] Vui long kiem tra lai ket noi hoac xac thuc GitHub tren man hinh.
)
echo ===================================================
pause

