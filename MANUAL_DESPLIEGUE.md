# 🚗 AutoCRM PRO MVP 3 - Manual de Despliegue e Instalación Autónoma

Este documento contiene la guía operativa oficial para instalar, configurar y desplegar **AutoCRM PRO MVP 3** en entornos Windows, tanto para uso en una sola computadora (puesto único) como en red local multi-puesto (servidor central + computadoras/tablets de vendedores).

---

## 📋 Requisitos Mínimos del Sistema

- **Sistema Operativo:** Windows 10 o Windows 11 (64-bit).
- **Procesador:** Dual-Core 2.0 GHz o superior (Intel Core i3 / AMD Ryzen 3 recomendado).
- **Memoria RAM:** 4 GB mínimo (8 GB recomendado en la máquina servidora).
- **Almacenamiento:** 500 MB libres en disco SSD / HDD.
- **Navegador Web:** Google Chrome, Microsoft Edge, Brave o Firefox (versiones actualizadas).

---

## 📥 Enlaces Directos a Requisitos Oficiales

1. **Node.js LTS (Entorno de Ejecución):**
   - Descarga oficial: [https://nodejs.org/](https://nodejs.org/) (Seleccionar la versión **LTS 20.x o 22.x**).
2. **Visual C++ Redistributable (Librerías C++ para SQLite):**
   - Descarga directa: [Microsoft Visual C++ Redistributable x64](https://aka.ms/vs/17/release/vc_redist.x64.exe).

---

## 🛠️ PASO 1: Instalación Inicial en la Computadora Servidora

1. Extraiga o copie la carpeta del proyecto `CRM_PRO_MVP_3` en una ubicación permanente (ejemplo: `C:\AutoCRM_PRO` o el Escritorio).
2. Abra la carpeta y ejecute haciendo doble clic en el archivo:
   ```cmd
   instalar_dependencias.bat
   ```
3. **¿Qué realiza este instalador automático?**
   - Comprueba la instalación de **Node.js**. Si no está instalado, abre automáticamente la página de descarga.
   - Instala las dependencias y compila los binarios nativos del motor **SQLite** (`better-sqlite3`).
   - Compila la versión de producción optimizada en la carpeta `/dist`.
   - Inicializa la base de datos local `crm_local.db` activando el modo de alta durabilidad **WAL (Write-Ahead Logging)**.

---

## 🚀 PASO 2: Iniciar el Sistema en la Máquina Servidora

Para iniciar el CRM en la computadora principal:

1. Haga doble clic en el lanzador:
   ```cmd
   iniciar_crm.bat
   ```
2. El sistema iniciará el servidor local y abrirá automáticamente su navegador en:
   `http://localhost:5173`

> 💡 **Nota:** Deje la ventana negra de la consola abierta mientras esté trabajando. Para cerrar el CRM, simplemente cierre esa ventana.

---

## 🌐 PASO 3: Configurar Acceso en Red Local (Vendedores y Terminales)

Cualquier otra computadora o tablet de la concesionaria conectada a la misma red WiFi o cable de red puede acceder al CRM sin instalar nada.

### 1. Obtener la dirección IP del Servidor
En la computadora servidora, ejecute haciendo doble clic:
```cmd
ver_ip_red.bat
```
El script mostrará la IP local de la máquina (ejemplo: `192.168.1.50`) y la URL de acceso:
`http://192.168.1.50:5173`

### 2. Abrir el Firewall de Windows
Al ejecutar `ver_ip_red.bat`, presione la tecla `S` para autorizar la apertura del puerto `5173` en el Firewall de Windows. 

Si prefiere hacerlo manualmente desde una consola como Administrador, ejecute:
```cmd
netsh advfirewall firewall add rule name="AutoCRM_PRO_5173" dir=in action=allow protocol=TCP localport=5173
```

### 3. Conectar las Terminales de Vendedores
Desde cualquier otra computadora, notebook o tablet en la misma red de la agencia:
1. Abra Google Chrome o Microsoft Edge.
2. Ingrese la dirección IP obtenida (ejemplo: `http://192.168.1.50:5173`).
3. Inicie sesión con el usuario asignado a cada vendedor.

---

## 🛡️ PASO 4: Respaldos y Protección de Datos

La base de datos completa se almacena localmente en el archivo `crm_local.db` dentro de la carpeta del sistema.

### 1. Resguardo Manual en 1 Clic
En cualquier momento puede realizar una copia de seguridad física haciendo doble clic en:
```cmd
hacer_backup_manual.bat
```
Esto creará una copia con fecha y hora en la carpeta `backups/` (ejemplo: `crm_backup_2026-09-21_15-30-00.db`).

### 2. Copia Automática a Google Drive o Pendrive
Desde la vista de **Administración** dentro del CRM:
1. Vaya a la pestaña **Base de Datos & Backup**.
2. Indique la ruta de sincronización de su Google Drive local (ejemplo: `G:\Mi unidad\CRM_Backups`).
3. Haga clic en **Generar Copia de Seguridad Física**.

---

## ❓ Solución Rápida a Problemas Frecuentes

### 1. "El puerto 5173 ya se encuentra ocupado"
- **Causa:** El servidor se encuentra abierto dos veces o hay otra aplicación utilizando el puerto.
- **Solución:** Cierre las ventanas de consola `iniciar_crm.bat` anteriores o reinicie el equipo.

### 2. "Otras computadoras de la red no pueden conectar (Tiempo de espera agotado)"
- **Causa:** El Firewall de Windows en la máquina servidora está bloqueando las conexiones entrantes.
- **Solución:** Ejecute `ver_ip_red.bat` y seleccione la opción `S` para abrir el puerto, o desactive temporalmente el Firewall de Red Privada.

### 3. "Error: Database is locked"
- **Causa:** Un proceso anterior dejó la base de datos abierta sin cerrar.
- **Solución:** El sistema trabaja en modo **SQLite WAL** que elimina bloqueos concurrentes. Si ocurre, cierre la ventana del servidor y vuelva a abrir `iniciar_crm.bat`.

---

**AutoCRM PRO MVP 3** - Sistema Comercial Autónomo & Tablero Directivo para Concesionarias.
