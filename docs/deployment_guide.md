# Netlify & GitHub Deployment Rehberi

Kimyasal Takip Sistemi'ni canlıya almak ve kullanıcı testi başlatmak için bu adımları takip edebilirsiniz.

## 1. GitHub Hazırlığı

Projeniz zaten bir Git deposu olarak görünüyor. Değişiklikleri commitleyip GitHub'daki bir depoya (repository) pushlamanız yeterlidir.

```bash
git add .
git commit -m "feat: deployment preparation and security hardening"
git push origin main
```

## 2. Netlify Proje Kurulumu

1. [Netlify Dashboard](https://app.netlify.com/)'a gidin.
2. **"Add new site"** > **"Import an existing project"** > **"GitHub"** adımlarını izleyin.
3. KTS deponuzu seçin.

## 3. Yapılandırma Ayarları (Netlify UI)

Netlify proje kök dizinindeki `netlify.toml` dosyasını otomatik olarak tanıyacaktır. Ancak şu ayarları kontrol edin:

- **Base directory:** `frontend/`
- **Build command:** `npm run build`
- **Publish directory:** `frontend/.next` (veya `.next`)

## 4. Çevre Değişkenleri (GEREKLİ)

Netlify üzerinde **Site Settings > Environment Variables** menüsünden aşağıdaki değişkenleri tanımlayın:

| Değişken Adı                    | Değer                     |
| ------------------------------- | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Proje URL        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase Service Role Key |
| `RESEND_API_KEY`                | Resend API Anahtarı       |
| `OPENROUTER_API_KEY`            | OpenRouter API Anahtarı   |

## 5. Dağıtım (Deploy)

Değişkenleri kaydettikten sonra **"Trigger deploy"** diyerek canlıya alabilirsiniz. Netlify size otomatik bir URL (örneğin: `kimyasal-takip.netlify.app`) verecektir.

---

**Not:** RLS politikalarının Supabase üzerinde uygulandığından emin olun (Önceki adımda yapılmıştı).
