@echo off
chcp 65001 > nul
title AutoCRM PRO MVP 3 - Resguardo Inmediato de Base de Datos

echo ==============================================================================
echo            AUTOCRM PRO MVP 3 - GENERADOR DE COPIA DE SEGURIDAD
echo ==============================================================================
echo.

node --input-type=module -e "import { db } from './server/db.js'; import fs from 'fs'; import path from 'path'; const backupsDir = path.resolve('./backups'); if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true }); const pad = n => String(n).padStart(2, '0'); const now = new Date(); const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`; const targetFile = path.join(backupsDir, `crm_backup_${ts}.db`); try { db.backup(targetFile); const stats = fs.statSync(targetFile); console.log('✅ Copia de seguridad física generada exitosamente.'); console.log('   Archivo:', targetFile); console.log('   Tamaño:', (stats.size / 1024).toFixed(2), 'KB'); } catch (e) { console.error('❌ Error al generar copia de seguridad:', e.message); process.exit(1); }"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Hubo un error al intentar crear el respaldo. Verifique los permisos en el disco.
) else (
    echo.
    echo 💡 CONSEJO DE SEGURIDAD:
    echo Se recomienda copiar la carpeta "backups" a un Pendrive o a la carpeta de Google Drive.
)

echo.
pause
