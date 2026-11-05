
@echo off
setlocal

title Playwright Automation Framework - Environment Setup

echo.
echo ==================================================
echo   Environment Setup - Playwright + OpenCart
echo ==================================================
echo.


REM ==================================================
REM 1. CHECK NODE.JS
REM ==================================================

echo [1/9] Checking Node.js installation...

node --version
if errorlevel 1 goto :error

npm --version
if errorlevel 1 goto :error

echo Node.js and npm are available.
echo.


REM ==================================================
REM 2. INSTALL TEST DATA AND ENVIRONMENT LIBRARIES
REM ==================================================

echo [2/9] Installing test data and environment libraries...

call npm install dotenv @faker-js/faker luxon
if errorlevel 1 goto :error

echo.


REM ==================================================
REM 3. INSTALL API AND DATA VALIDATION LIBRARIES
REM ==================================================

echo [3/9] Installing API and data validation libraries...

call npm install ajv csv-parse xlsx
if errorlevel 1 goto :error

echo.


REM ==================================================
REM 4. INSTALL ACCESSIBILITY TESTING
REM ==================================================

echo [4/9] Installing accessibility testing libraries...

call npm install -D @axe-core/playwright
if errorlevel 1 goto :error

echo.


REM ==================================================
REM 5. INSTALL PLAYWRIGHT AND TYPESCRIPT SUPPORT
REM ==================================================

echo [5/9] Installing Playwright and TypeScript dependencies...

call npm install -D @playwright/test @types/node
if errorlevel 1 goto :error

echo.


REM ==================================================
REM 6. INSTALL ALLURE REPORTING
REM ==================================================

echo [6/9] Installing Allure reporting dependencies...

call npm install -D allure-playwright allure-commandline
if errorlevel 1 goto :error

echo.


REM ==================================================
REM 7. INSTALL MYSQL DATABASE CONNECTIVITY
REM ==================================================

echo [7/9] Installing MySQL database dependencies...

call npm install mysql2
if errorlevel 1 goto :error

echo.


REM ==================================================
REM 8. INSTALL PLAYWRIGHT BROWSERS
REM ==================================================

echo [8/9] Installing Playwright browser binaries...

call npx playwright install
if errorlevel 1 goto :error

echo.


REM ==================================================
REM 9. VERIFY JAVA FOR ALLURE REPORT GENERATION
REM ==================================================

echo [9/9] Checking Java installation...

java -version

if errorlevel 1 (
    echo.
    echo WARNING: Java is not installed or not configured.
    echo Allure HTML report generation requires Java.
    echo Install a compatible JDK and configure JAVA_HOME.
    echo.
) else (
    echo Java is available.
)

echo.


REM ==================================================
REM VERIFY PLAYWRIGHT INSTALLATION
REM ==================================================

echo Verifying Playwright installation...

call npx playwright --version
if errorlevel 1 goto :error

echo.


REM ==================================================
REM VERIFY ALLURE INSTALLATION
REM ==================================================

echo Verifying Allure installation...

call npx allure --version
if errorlevel 1 goto :error

echo.


REM ==================================================
REM SUCCESS
REM ==================================================

echo ==================================================
echo   Environment Setup Completed Successfully!
echo ==================================================

echo.
echo Installed components:
echo.
echo - Playwright Test
echo - Chromium, Firefox and WebKit
echo - dotenv
echo - Faker
echo - Luxon
echo - AJV
echo - CSV Parse
echo - XLSX
echo - Axe Playwright
echo - Allure Playwright
echo - Allure Commandline
echo - MySQL2
echo - Node.js Type Definitions
echo.

pause
exit /b 0


REM ==================================================
REM ERROR HANDLING
REM ==================================================

:error

echo.
echo ==================================================
echo   ERROR: Environment Setup Failed!
echo ==================================================

echo Please check the error messages above.

pause

exit /b 1
