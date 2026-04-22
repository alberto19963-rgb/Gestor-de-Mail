# 🚀 Guía de Actualización Maestra (Formato Luis Alberto)

Sigue siempre estos pasos para desplegar las nuevas versiones en el NAS:

## 1. En tu Mac
1. Abre **GitHub Desktop**.
2. Verifica que todos los cambios estén seleccionados.
3. Escribe un mensaje descriptivo para el commit.
4. Haz clic en **"Push origin"** para subir los cambios a GitHub.

## 2. En tu NAS (Vía Terminal)
1. Conéctate por SSH a tu NAS.
2. Ve a la carpeta del proyecto: `cd /volume1/docker/Gestor-de-Mail` (o tu ruta actual).
3. **Baja el código nuevo:**
   ```bash
   git pull origin main
   ```
4. **Reconstruye el sistema (Docker V2):**
   ```bash
   sudo docker compose up --build -d
   ```

---
*Nota: Se usa "docker compose" (con espacio) porque el NAS usa la versión V2 de Docker.*
