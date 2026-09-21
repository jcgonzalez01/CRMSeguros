# CRM Seguros

CRM interno para un equipo de corredores de seguros: dashboard semanal,
clientes, pólizas, aseguradoras, oportunidades, tareas y equipo, con datos
compartidos en tiempo real.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Supabase Cloud (Postgres, Auth, Realtime)
- React Query + Realtime para sincronización en vivo entre usuarios
- Despliegue: Docker en Coolify (ver [docs/deployment.md](docs/deployment.md))

## Desarrollo local

```bash
npm install
cp .env.local.example .env.local   # completa con tus credenciales de Supabase
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Base de datos

Las migraciones viven en `supabase/migrations/`. Para aplicarlas contra tu
proyecto de Supabase:

```bash
npx supabase link --project-ref <tu-project-ref>
npx supabase db push
```

El primer usuario se crea manualmente desde el dashboard de Supabase
(Authentication > Users); desde ahí puedes invitar al resto del equipo
desde la sección **Equipo** de la app.

## Despliegue

Ver [docs/deployment.md](docs/deployment.md) para el flujo completo con
Coolify.
