# ----------------------------
# ETAPA 1: Construcción (Build)
# ----------------------------
# CORRECCIÓN AQUÍ: Falta "as build" al final
FROM node:22-alpine as build

WORKDIR /app

# Copiamos primero los package.json para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Compilamos el proyecto para producción
RUN npm run build


# ----------------------------
# ETAPA 2: Servidor Apache
# ----------------------------
FROM httpd:2.4-alpine

# 1. Copiamos los archivos compilados desde la Etapa 1
# Ahora sí funciona porque la etapa de arriba se llama "build"
COPY --from=build /app/dist /usr/local/apache2/htdocs/

# 2. Copiamos tu archivo de configuración del VirtualHost
COPY ./my-vhost.conf /usr/local/apache2/conf/extra/my-vhost.conf

# 3. Habilitamos los módulos necesarios en httpd.conf
RUN sed -i \
    -e 's/^#\(LoadModule rewrite_module modules\/mod_rewrite.so\)/\1/' \
    -e 's/^#\(LoadModule proxy_module modules\/mod_proxy.so\)/\1/' \
    -e 's/^#\(LoadModule proxy_http_module modules\/mod_proxy_http.so\)/\1/' \
    /usr/local/apache2/conf/httpd.conf

# 4. Incluimos nuestra configuración personalizada
RUN echo "Include /usr/local/apache2/conf/extra/my-vhost.conf" >> /usr/local/apache2/conf/httpd.conf