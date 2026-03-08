# İstihbarat Botu (Crawl4AI) Otomasyon Rehberi

Bu rehber, hazırladığımız `sync_intelligence.py` botunu nasıl otomatik hale getireceğinizi anlatır.

## Seçenek 1: GitHub Actions (Ücretsiz ve Kolay)

Bu yöntemle bir sunucuya ihtiyaç duymazsınız. Belirlediğiniz saatte GitHub sizin yerinize botu çalıştırır.

### Adımlar:

1.  **Kodları Push Edin:** Hazırladığım `.github/workflows/intelligence_sync.yml` dosyasını ana branch'e (main) gönderin.
2.  **GitHub Secrets Ayarlayın:** GitHub sayfanızda `Settings -> Secrets and Variables -> Actions` kısmına gidin ve şu iki anahtarı ekleyin:
    - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL'niz.
    - `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (Admin yetkili anahtar).
3.  **Çalıştırın:** Bot her gece 03:00'te otomatik çalışacak. İsterseniz GitHub Actions sekmesinden "Run Workflow" diyerek hemen test edebilirsiniz.

---

## Seçenek 2: Kendi VPS Sunucunuz (Daha Hızlı)

Eğer kendi Ubuntu sunucunuz varsa, şu adımları izleyebilirsiniz:

### 1. Ortamı Hazırlayın

```bash
# Repo içine gidin
cd scripts/crawler
# Sanal ortam oluşturun
python3 -m venv venv
source venv/bin/activate
# Bağımlılıkları yükleyin
pip install -r requirements.txt
playwright install --with-deps chromium
```

### 2. Ortam Değişkenlerini Tanımlayın (Environment Variables)

`.env` dosyası oluşturun:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="ey..."
```

### 3. Zamanlanmış Görev (Cron Job) Ekleyin

```bash
crontab -e
```

Dosyanın en altına şu satırı ekleyin (Her gün sabah 03:00):

```bash
0 3 * * * /path/to/project/scripts/crawler/venv/bin/python /path/to/project/scripts/crawler/sync_intelligence.py
```

---

## Önemli Notlar

- **Crawl4AI:** Web sitesinin yapısına göre bazen 30 saniye kadar sürebilir. 10 site yaklaşık 5 dakikada tamamlanır.
- **Vektörleştirme (Embedding):** Şu anki script veriyi metin olarak kaydeder. Vektör (Embedding) üretimi için `expert.ts` içindeki arama fonksiyonunu "Keyword Search" (SQL ILIKE) olarak güncelledim. Eğer tam sektörel vektör arama isterseniz, script içine bir embedding API çağrısı eklememiz gerekecek.
