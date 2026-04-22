# 🚀 Guía de Despliegue en NAS Ugreen

Sigue estos pasos para instalar tu Gestor de Mail en el NAS:

## 1. Preparación de Archivos
1. Copia la carpeta completa `Gestor de Mail` a tu NAS.
2. Te recomiendo ponerla en la ruta: `/volume1/docker/gestor-mail` (o la que uses para tus contenedores).

## 2. Configuración (.env)
1. Edita el archivo `.env.example` y cámbiale el nombre a `.env`.
2. Introduce tus credenciales de Google y Microsoft (Client ID y Secret).
3. Asegúrate de que las URLs de redirección coincidan con la IP de tu NAS o tu dominio.

## 3. Despliegue (Opción A: Interfaz Ugreen)
1. Abre la aplicación **Docker** en tu Ugreen.
2. Ve a **"Project"** (Proyecto) y dale a **"Create"**.
3. Ponle un nombre (ej: `mail-manager`).
4. Selecciona el archivo `docker-compose.yml` que está en la carpeta.
5. El sistema detectará los 4 servicios automáticamente.
6. Dale a **"Next"** y luego a **"Done"**. ¡Docker empezará a descargar las imágenes y construir los frontends!

## 4. Acceso Terminal (Opción Recomendada)
Si prefieres usar la terminal como haces siempre:
```bash
git pull origin main
sudo docker compose up --build -d
```

---

## Notas Importantes
- **Base de Datos**: No necesitas instalar nada más, el contenedor `db` se encarga de todo.
- **Persistencia**: Los datos se guardan en un volumen interno. Si borras la carpeta de Docker, los datos seguirán ahí a menos que borres el volumen.
