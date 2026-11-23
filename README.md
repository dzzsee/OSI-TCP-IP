# OSI-TCP-IP

Pagina educativa interactiva sobre los modelos OSI y TCP/IP, con asistente de IA mediante NVIDIA API.

## Ejecutar localmente

1. Copia `.env.example` a `.env`.
2. Introduce tu clave en `NVIDIA_API_KEY`.
3. Ejecuta `npm start`.
4. Abre `http://localhost:4173`.

No publiques `.env`: esta ignorado por Git. Para GitHub Pages, introduce la clave temporalmente en el panel del asistente. GitHub Pages no puede proteger una clave incluida en codigo JavaScript.

## Publicar en GitHub Pages

En GitHub, activa Pages desde **Settings > Pages > Build and deployment > GitHub Actions**. Cada push a `main` despliega automaticamente con `.github/workflows/pages.yml`.