# Despliegue en Coolify

La app se despliega como contenedor Docker en tu VPS vía Coolify. Supabase
se queda en Supabase Cloud — no necesitas nada de Postgres en el VPS.

## 1. Antes de desplegar

Corre las migraciones contra tu proyecto de Supabase Cloud (una sola vez,
o cada vez que agregues una migración nueva):

```bash
npx supabase link --project-ref <tu-project-ref>
npx supabase db push
```

`<tu-project-ref>` es el subdominio de tu URL de Supabase, ej. si tu URL es
`https://ydltganxuwzuzmwcreou.supabase.co`, el ref es `ydltganxuwzuzmwcreou`.
Te va a pedir la contraseña de la base de datos (Project Settings >
Database).

## 2. Crear el recurso en Coolify

1. En Coolify, **+ New Resource > Application**, elige tu repo git
   (GitHub/GitLab o el remoto que uses).
2. Build pack: **Dockerfile** (Coolify detecta el `Dockerfile` en la raíz
   automáticamente).
3. Puerto expuesto: **3000**.

## 3. Variables de entorno

En la pestaña **Environment Variables** del recurso, agrega:

| Variable | Valor | Alcance |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tu URL de Supabase | **Build ARG + runtime** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon key | **Build ARG + runtime** |
| `NEXT_PUBLIC_SITE_URL` | la URL pública final de la app (ej. `https://crm.tudominio.com`) | **Build ARG + runtime** |
| `SUPABASE_SERVICE_ROLE_KEY` | tu service_role key | **Solo runtime** |

Importante: las variables `NEXT_PUBLIC_*` se incrustan en el bundle del
cliente durante el build, así que en Coolify deben marcarse también como
**"Build Variable"** (no solo runtime), o el JS del navegador terminará sin
esos valores. `SUPABASE_SERVICE_ROLE_KEY` es secreta y solo se usa
server-side — no la marques como build variable ni la expongas al cliente.

## 4. Dominio y SSL

Configura tu subdominio (ej. `crm.tudominio.com`) apuntando a la IP del VPS
con un registro DNS tipo A, y agrégalo en la pestaña **Domains** del
recurso en Coolify. Coolify emite el certificado SSL automáticamente.

## 5. Deploy

Coolify construye y despliega automáticamente al hacer push a la rama
conectada. También puedes forzar un deploy manual desde su UI.

## 6. Verificación

- Abre la URL pública, confirma que carga `/login`.
- Inicia sesión con la primera cuenta (creada manualmente desde el
  dashboard de Supabase — ver más abajo).
- Confirma que el Dashboard y los módulos cargan datos reales.

## Primer usuario (bootstrap)

La app no tiene registro abierto — solo invitación desde `/equipo`, y para
invitar ya necesitas estar autenticado. Para el primer usuario:

1. Ve a tu proyecto de Supabase Cloud > **Authentication > Users**.
2. **Add user** > crea el usuario con correo y contraseña manualmente
   (marca "Auto Confirm User").
3. El trigger `handle_new_user` crea su fila en `profiles` automáticamente.
4. Inicia sesión en la app con esas credenciales. Desde ahí ya puedes
   invitar al resto del equipo desde `/equipo`.
