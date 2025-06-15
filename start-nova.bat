@echo off
REM start-nova.bat - Script de démarrage NOVA pour Windows

echo 🚀 DÉMARRAGE DE LA MISSION NOVA
echo ================================

REM Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

REM Vérifier Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

REM Vérifier Angular CLI
ng version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Angular CLI n'est pas installé, installation...
    npm install -g @angular/cli
)

echo [INFO] Vérifications terminées ✅
echo.

REM Démarrer l'API Python
echo [INFO] 🐍 Démarrage de l'API Python (Agent Hamadi)...
cd api

REM Créer l'environnement virtuel s'il n'existe pas
if not exist "venv" (
    echo [WARNING] Création de l'environnement virtuel...
    python -m venv venv
)

REM Activer l'environnement virtuel
call venv\Scripts\activate.bat

REM Installer les dépendances si nécessaire
if not exist "requirements_installed.lock" (
    echo [INFO] Installation des dépendances Python...
    pip install -r requirements.txt
    echo. > requirements_installed.lock
)

REM Vérifier le fichier .env
if not exist ".env" (
    echo [WARNING] Fichier .env non trouvé, copie du template...
    copy .env.example .env
    echo [WARNING] ⚠️ N'oubliez pas de configurer vos clés API dans .env après le briefing !
)

REM Démarrer l'API en arrière-plan
echo [INFO] Lancement de l'API NOVA sur http://localhost:8000
start "NOVA API" python main.py

REM Attendre que l'API soit prête
timeout /t 3 /nobreak >nul

REM Retourner au dossier racine
cd ..

REM Démarrer Angular
echo [INFO] 🅰️ Démarrage du serveur Angular...
echo [INFO] Interface NOVA sur http://localhost:4200
start "NOVA Interface" ng serve

REM Attendre qu'Angular soit prêt
timeout /t 5 /nobreak >nul

echo.
echo [SUCCESS] 🎯 MISSION NOVA DÉPLOYÉE AVEC SUCCÈS !
echo.
echo 📡 URLs disponibles:
echo    - Interface NOVA: http://localhost:4200
echo    - API Python: http://localhost:8000
echo    - Documentation API: http://localhost:8000/docs
echo.
echo 🎮 Deux fenêtres ont été ouvertes pour les serveurs
echo    Fermez les fenêtres pour arrêter les services
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul