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

La app es multi-empresa: no hay registro abierto, y el primer usuario tiene
que ser el **Manager** (el rol de plataforma, sin empresa, que crea
corredoras nuevas desde `/plataforma`). No se puede crear desde el botón
"Add user" del dashboard de Supabase porque esa UI no permite fijar el
`user_metadata` (`role: "Manager"`) que el trigger `handle_new_user`
necesita para no fallar la validación (`Admin` requiere `empresa_id`,
`Manager` no debe tenerlo).

Créalo con un script de una sola vez, usando la `service_role` key:

```js
// bootstrap-manager.mjs — correr una sola vez, luego borrar el archivo
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://tu-proyecto.supabase.co",
  "tu-service-role-key",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await admin.auth.admin.createUser({
  email: "tu-correo@dominio.com",
  password: "una-contraseña-segura",
  email_confirm: true,
  user_metadata: { full_name: "Tu Nombre", role: "Manager" },
});

console.log(error ?? data.user.id);
```

```bash
node bootstrap-manager.mjs
```

Luego:
1. Inicia sesión con ese correo/contraseña — te redirige a `/plataforma`.
2. **Nueva empresa** → crea la primera corredora real; te pide el
   correo/nombre de su primer Admin, a quien se le manda una invitación
   por correo para crear su contraseña.
3. Desde ahí, cada corredora administra su propio equipo desde `/equipo`
   (invitar, restablecer contraseña, bloquear, eliminar) sin volver a
   tocar la base de datos directamente.
