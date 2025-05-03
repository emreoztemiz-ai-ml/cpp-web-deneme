FROM ubuntu:22.04

# Sistem güncelle
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    nodejs \
    npm

# Uygulama dosyalarını kopyala
WORKDIR /app
COPY . .

# Node modülleri kur
RUN npm install

# Sunucuyu başlat
CMD ["node", "server.js"]
