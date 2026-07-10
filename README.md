# App Compras · SkySense

Aplicación web (HTML estático + Supabase) para el control de **Compras** y **Pagos**.

- **index.html** — pantalla de intro (fondo blanco) con botón de entrada.
- **login.html** — iniciar sesión, crear cuenta y restablecer contraseña.
- **app.html** — aplicación con 2 módulos según el rol:
  - **General Compras** — datos completos (hoja *GENERAL Compras*). Solo **admin**.
  - **Pagos** — subconjunto para PMs (hoja *VISUALIZACION pms*) + comentarios en cronograma. Ve **admin** y **PM**.

Roles:

- **admin** (usuario de compras): ve los 2 módulos, carga el Excel de forma masiva (agregar o reemplazar).
- **pm**: solo ve el módulo Pagos; puede consultar y **agregar comentarios** (el más reciente queda arriba).

---

## Arquitectura

- **Frontend:** HTML/CSS/JS puro, sin build. Librerías por CDN: `@supabase/supabase-js` y `SheetJS (xlsx)`.
- **Backend:** Supabase (PostgreSQL + Auth + RLS).
- **Modelo de datos:** una sola tabla fuente `compras` (sin fragmentar). El módulo Pagos es una **vista** (`vista_pagos`) que deriva de `compras`, por lo que **se pobla y sincroniza solo**. Los comentarios viven en `comentarios_pago`.
- **Hosting:** GitHub Pages.

```
app-compras/
├── index.html          # intro
├── login.html          # auth
├── app.html            # módulos + carga Excel + comentarios
├── js/
│   └── config.js       # URL y anon key de Supabase  <-- EDITAR
├── sql/
│   └── schema.sql       # script para crear toda la BD
├── .gitignore
└── README.md
```

---

## PASO 1 — Crear la base de datos en Supabase

1. Entra a tu proyecto en <https://supabase.com> → **SQL Editor** → **New query**.
2. Abre `sql/schema.sql`, copia **todo** el contenido, pégalo y presiona **Run**.
   - Crea: `profiles`, `compras`, la vista `vista_pagos`, `comentarios_pago`, índices, triggers y las **políticas RLS**.
3. **Auth → Providers → Email:** deja habilitado *Email*. Para pruebas rápidas puedes desactivar *Confirm email* (Auth → Settings), o dejarlo activo para producción.
4. **Auth → URL Configuration:** en *Site URL* pon la URL final de GitHub Pages (Paso 3), p. ej. `https://TU-USUARIO.github.io/app-compras/`. Agrégala también en *Redirect URLs* (necesario para el reset de contraseña).

## PASO 2 — Conectar el frontend con Supabase

1. En Supabase: **Project Settings → API**. Copia:
   - **Project URL**
   - **anon public key** (es pública y segura; la protección real la dan las políticas RLS. **Nunca** uses la `service_role`).
2. Abre `js/config.js` y reemplaza:
   ```js
   const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
   const SUPABASE_ANON_KEY = "TU_ANON_KEY_PUBLICA";
   ```

## PASO 3 — Subir a GitHub y publicar con GitHub Pages

Con Git instalado, desde la carpeta `app-compras/`:

```bash
git init
git add .
git commit -m "feat: version inicial App Compras (v1.0.0)"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/app-compras.git
git push -u origin main
```

Publicar:

1. En el repo: **Settings → Pages**.
2. *Source:* **Deploy from a branch** → Branch: **main** → carpeta **/ (root)** → **Save**.
3. En 1–2 min tu app estará en `https://TU-USUARIO.github.io/app-compras/`.
4. Regresa al **Paso 1.4** y confirma que esa URL esté en *Site URL* / *Redirect URLs* de Supabase.

## PASO 4 — Crear el usuario admin (compras)

1. Abre la app publicada → **Crear cuenta** con el correo del admin (`julio.sanchez@skysense.com.mx`).
2. En Supabase → SQL Editor, corre:
   ```sql
   update public.profiles set rol = 'admin'
   where email = 'julio.sanchez@skysense.com.mx';
   ```
3. Cualquier otra cuenta que se registre queda como **pm** automáticamente. (Puedes promover otros a admin con el mismo `update`.)

## PASO 5 — Cargar el Excel (masivo)

1. Entra como **admin** → módulo **General Compras** → botón **⬆ Cargar Excel**.
2. Selecciona tu archivo. La app lee la hoja **GENERAL Compras** y te pregunta:
   - **➕ Agregar a lo existente** — inserta las filas sin borrar las actuales.
   - **♻ Reemplazar todo** — borra lo anterior y carga solo lo nuevo.
3. El módulo **Pagos** se actualiza solo (es una vista de `compras`). No se carga por separado.

---

## Control de versiones (buenas prácticas)

- **Ramas:** trabaja en ramas `feature/...` o `fix/...` y haz *merge* a `main` por Pull Request.
- **Commits (Conventional Commits):**
  - `feat:` nueva funcionalidad · `fix:` corrección · `docs:` documentación · `refactor:` · `chore:`
- **Versionado semántico (SemVer):** `MAJOR.MINOR.PATCH`. Etiqueta releases:
  ```bash
  git tag -a v1.0.0 -m "Version inicial"
  git push origin v1.0.0
  ```
- **`.gitignore`** ya evita subir archivos `.xlsx` con datos reales.
- **Nunca** subas la `service_role` key ni credenciales sensibles al repo.

## Seguridad (RLS activo)

- La tabla `compras` **solo** es accesible para `admin` (política `compras_admin_all`).
- Los PM solo pueden leer `vista_pagos` (subconjunto de columnas) y escribir en `comentarios_pago`; nunca acceden a la tabla completa.
- Los comentarios son un cronograma: cualquiera autenticado los lee, se insertan con el usuario actual y solo el admin puede borrarlos.

---

## Valor agregado sugerido (roadmap)

Comentarios como diseñador/DBA/analista de compras senior:

1. **Auditoría:** agregar `updated_by` y una tabla `historial_compras` con trigger para registrar cambios (quién y cuándo). Clave en un flujo de finanzas.
2. **Dashboard/KPIs:** tarjetas con total pagado vs. pendiente, monto por proyecto/moneda y días promedio de pago. Ayuda al analista de compras a detectar cuellos de botella.
3. **Alertas:** resaltar OCs con `DIFERENCIA PAGO VS FACTURA` ≠ 0 o facturas sin evidencia.
4. **Exportar:** botón para descargar la vista filtrada a Excel/CSV.
5. **Llave de negocio:** definir una clave única (p. ej. `OC` + `FOLIOFISCAL`) y usar *upsert* en la carga para actualizar en vez de duplicar. Hoy “Agregar” inserta; “Reemplazar” sustituye todo.
6. **Notificaciones:** al agregar un comentario, avisar por correo al admin (Supabase Edge Function).
7. **Realtime:** usar Supabase Realtime para que los comentarios aparezcan en vivo sin recargar.
8. **Paginación server-side** si la tabla supera ~5,000 filas (hoy carga hasta 5,000).

---

**Versión:** 1.0.0 · SkySense
