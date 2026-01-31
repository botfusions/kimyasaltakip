# Admin Kullanıcı Oluşturma Rehberi

Bu dosya, Supabase'de ilk admin kullanıcısını nasıl oluşturacağınızı adım adım anlatır.

## Adım 1: Supabase Dashboard'da Kullanıcı Oluştur

1. **Supabase Dashboard**'a gidin: https://supabase.com/dashboard
2. Projenizi seçin (`lsppsvspgpifuirzxqic`)
3. Sol menüden **Authentication** > **Users** sekmesine gidin
4. Sağ üstteki **"Add user"** butonuna tıklayın
5. **Email** ve **Password** girin:
   - Email: `selam@botfusions.com`
   - Password: `Ce848005/1`
6. **"Create user"** butonuna tıklayın

✅ Kullanıcı Supabase Auth sisteminde oluşturuldu!

---

## Adım 2: Users Tablosuna Admin Kaydı Ekle

Şimdi bu kullanıcıyı `users` tablomuzda admin olarak kaydetmemiz gerekiyor.

1. Sol menüden **SQL Editor** sekmesine gidin
2. Aşağıdaki SQL sorgusunu yapıştırın:

```sql
-- Supabase Auth'dan kullanıcı ID'sini al ve users tablосuna ekle
INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
SELECT 
    id,
    'selam@botfusions.com',
    'Admin User',
    'admin'::VARCHAR(50),
    true,
    now(),
    now()
FROM auth.users
WHERE email = 'selam@botfusions.com'
ON CONFLICT (id) DO NOTHING;
```

3. **"Run"** butonuna tıklayın

✅ Admin kullanıcı artık sisteme kayıtlı!

---

## Adım 3: Doğrulama

Kullanıcının başarıyla eklendiğini kontrol edin:

```sql
-- Users tablosunda admin kullanıcısını görüntüle
SELECT id, email, name, role, is_active, created_at
FROM users
WHERE email = 'selam@botfusions.com';
```

**Beklenen Sonuç:**
```
id                  | email                    | name       | role  | is_active | created_at
--------------------+--------------------------+------------+-------+-----------+------------
<uuid>              | selam@botfusions.com     | Admin User | admin | true      | <timestamp>
```

---

## 🎯 Tamamlandı!

Artık bu kullanıcı ile login sayfasından giriş yapabilirsiniz:
- Email: `selam@botfusions.com`
- Password: `Ce848005/1`

---

## 🔒 Güvenlik Uyarısı

> [!WARNING]
> İlk giriş yaptıktan sonra şifrenizi değiştirmeniz önerilir!

Dashboard > Settings sayfasından şifre değiştirebilirsiniz.
