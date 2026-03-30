@echo off
REM ============================================
REM FasoMarket Backend - Cleanup Unused DDD Structure
REM ============================================
REM These folders contain unused DDD (Domain-Driven Design) code
REM that is NOT used by the active application (app.js uses routes/ and controllers/)
REM 
REM Before running, make sure to backup or commit your code!
REM ============================================

echo.
echo ========================================
echo FasoMarket Backend Cleanup Script
echo ========================================
echo.
echo The following folders will be DELETED:
echo   - src/application/
echo   - src/domain/
echo   - src/infrastructure/
echo   - src/presentation/
echo   - src/shared/
echo.
echo These folders contain unused DDD architecture code.
echo Your active code (routes/, controllers/, models/, etc.) will NOT be affected.
echo.

set /p confirm="Are you sure you want to proceed? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Operation cancelled.
    exit /b 0
)

echo.
echo Removing unused DDD folders...

REM Remove application folder
if exist "src\application" (
    rmdir /s /q "src\application"
    echo [DELETED] src/application/
)

REM Remove domain folder
if exist "src\domain" (
    rmdir /s /q "src\domain"
    echo [DELETED] src/domain/
)

REM Remove infrastructure folder
if exist "src\infrastructure" (
    rmdir /s /q "src\infrastructure"
    echo [DELETED] src/infrastructure/
)

REM Remove presentation folder
if exist "src\presentation" (
    rmdir /s /q "src\presentation"
    echo [DELETED] src/presentation/
)

REM Remove shared folder
if exist "src\shared" (
    rmdir /s /q "src\shared"
    echo [DELETED] src/shared/
)

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo.
echo Your backend structure is now cleaner:
echo   - src/config/        (configuration)
echo   - src/controllers/   (route handlers)
echo   - src/middlewares/   (Express middlewares)
echo   - src/models/        (Mongoose models)
echo   - src/routes/        (Express routes)
echo   - src/services/      (business logic)
echo   - src/socket/        (Socket.IO)
echo   - src/utils/         (utilities)
echo.
echo Run 'npm start' to verify everything works.
echo.
pause
