# STAS Web — Panduan Cepat

## Instalasi

```bash
pip install flask
```

## Menjalankan

```bash
cd proyek-stas
python app.py
```

Buka browser: http://localhost:5000

## Login

| Tipe   | URL            | Credential (contoh)          |
|--------|----------------|------------------------------|
| Member | /login         | username: rauf / pw: raufrex123 |
| Admin  | /admin/login   | password: STAS@AdminSecure2026! |

## Tambah Member Baru

Buat 3 file berikut (ganti `[username]` dengan nama file, huruf kecil):

**stas/name/[username].txt**
```
Nama Lengkap Member
```

**stas/desk/[username].txt**
```
Deskripsi singkat posisi atau peran
```

**stas/database/[username].txt**
```
PASSWORD: passwordrahasia
===========================================
STAS INTERNAL MEMBER DATA BASE
===========================================
ID ANGGOTA     : STAS-2026-X
STATUS UTAMA   : Sang Technology 
DIVISI         : Nama Divisi
TANGGAL GABUNG : DD Bulan YYYY
REGIONAL       : Nama Regional
```

## Galeri

Taruh file foto (jpg, png, gif, webp) atau video (mp4, webm, mov) ke folder `stas/galery/`.

## Ganti Password Admin

Edit baris berikut di `app.py`:
```python
ADMIN_PASSWORD = "STAS@AdminSecure2026!"
```
