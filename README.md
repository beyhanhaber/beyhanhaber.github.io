# Beyhan Haber

## Gerçek sistem kurulumu

1. .env.example dosyasını .env adıyla kopyalayın.
2. MongoDB Atlas bağlantı cümlenizi MONGODB_URI satırına ekleyin.
3. JWT_SECRET değerini uzun ve rastgele bir değer yapın.
4. Terminalde npm install, sonra npm start komutlarını çalıştırın.
5. Site http://localhost:3000 adresinde açılır.

.env ve uploads klasörü GitHub'a gönderilmez. Yönetici girişi .env içindeki tek e-posta/şifreyle yapılır. Bu bilgileri yalnızca .env dosyasında tutun; README veya GitHub'a eklemeyin.

## Yayın

Bu proje MongoDB kullandığı için yalnız GitHub Pages'e konulamaz: GitHub Pages Node.js sunucusu çalıştırmaz. En kolay yol projeyi GitHub'a yükleyip Render veya Railway üzerinde yayınlamaktır. Bu servisler npm start komutunu çalıştırır ve .env değerlerini platformun gizli değişkenler bölümüne eklersiniz.
