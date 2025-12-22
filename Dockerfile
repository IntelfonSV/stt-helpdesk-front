# ----------------------------
# ETAPA 1: Construcción (Build)
# ----------------------------
FROM node:22-alpine

WORKDIR /app

# Copiamos primero los package.json para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Compilamos el proyecto para producción
# NOTA: Esto suele generar una carpeta 'dist' (si usas Vite) o 'build' (si usas CRA).
# Verifica en tu package.json cuál es el output. Aquí asumo 'dist'.
RUN npm run build


# ----------------------------
# ETAPA 2: Servidor Apache
# ----------------------------
FROM httpd:2.4-alpine

# 1. Copiamos los archivos compilados desde la Etapa 1
# Si tu proyecto genera una carpeta 'build' en lugar de 'dist', cambia /app/dist por /app/build
COPY --from=build /app/dist /usr/local/apache2/htdocs/

# 2. Copiamos tu archivo de configuración del VirtualHost
# Asegúrate de que el archivo 'my-vhost.conf' esté en la misma carpeta que este Dockerfile
COPY ./my-vhost.conf /usr/local/apache2/conf/extra/my-vhost.conf

# 3. Habilitamos los módulos necesarios en httpd.conf
# Apache Alpine trae estos módulos desactivados por defecto.
# Necesitamos: mod_rewrite (para SPA), mod_proxy y mod_proxy_http (para la API)
RUN sed -i \
    -e 's/^#\(LoadModule rewrite_module modules\/mod_rewrite.so\)/\1/' \
    -e 's/^#\(LoadModule proxy_module modules\/mod_proxy.so\)/\1/' \
    -e 's/^#\(LoadModule proxy_http_module modules\/mod_proxy_http.so\)/\1/' \
    /usr/local/apache2/conf/httpd.conf

# 4. Incluimos nuestra configuración personalizada al final del archivo principal
RUN echo "Include /usr/local/apache2/conf/extra/my-vhost.conf" >> /usr/local/apache2/conf/httpd.conf