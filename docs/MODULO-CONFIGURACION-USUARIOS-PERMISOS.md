# Módulo de Configuración: Usuarios, Roles y Permisos — KaiCredit RD

Guía práctica para construir, en otro proyecto, la pantalla de Configuración
que le permite al Admin de cada empresa **gestionar usuarios** y **definir
qué puede ver/editar cada rol**, sin tocar código ni pedirle nada al
desarrollador. Es el complemento de UI de
[MULTI-EMPRESA-Y-ROLES.md](MULTI-EMPRESA-Y-ROLES.md) (que cubre la base de
datos) — aquí está el "cómo se construye el módulo" en el frontend + API.

Requiere ya tener implementado el patrón de esa guía: `companies`,
`profiles.company_id`, `current_user_role()`/`current_user_company_id()`,
y la tabla `module_permissions` (sección 6 de esa guía).

---

## 1. Qué contiene el módulo

Una sola pantalla de Configuración con (al menos) dos pestañas:

1. **Usuarios del Sistema** — listar, crear, restablecer contraseña,
   bloquear/desbloquear y eliminar usuarios de tu propia empresa.
2. **Permisos por Rol** — una matriz rol × módulo donde el Admin elige
   `Bloqueado / Ver / Editar` para cada combinación.

Ambas viven detrás de un solo botón "Usuarios" en el encabezado, visible
solo para `Admin`. Ningún otro rol ve esta pantalla ni el botón que la abre.

---

## 2. Pestaña "Usuarios del Sistema"

### 2.1 Por qué necesita un API route (no basta con Supabase client-side)

Crear/bloquear/borrar usuarios requiere la **Admin API de Supabase Auth**
(`supabase.auth.admin.*`), que solo funciona con la `service_role` key —
nunca se expone esa key al navegador. Por eso este CRUD **no** puede vivir
en `lib/` como el resto de las acciones (que sí van directo a Postgres desde
el cliente vía RLS); necesita un API route de servidor que:

1. Recibe el JWT del que llama en el header `Authorization`.
2. Lo valida con `supabaseAdmin.auth.getUser(token)`.
3. Busca su `profile` y confirma `role === 'Admin'`.
4. Recién ahí ejecuta la acción, **siempre acotada a `company_id` del
   solicitante** — nunca al `userId`/`companyId` que venga en el body sin
   verificar.

> **Nota (CRM Seguros)**: en un proyecto Next.js App Router con Server
> Actions, este mismo requisito se satisface sin un API route aparte — una
> Server Action ya corre server-side con la sesión del que llama (vía
> cookies), así que el mismo paso 1-3 se hace con el cliente normal de
> Supabase (`createClient()` server-side) antes de instanciar el cliente
> admin. Ver `src/lib/actions/equipo.ts`.

### 2.2 Estructura del API route (una sola ruta, varias "acciones")

```ts
// app/api/admin-usuarios/route.ts
interface Peticion {
  accion: 'listar' | 'crear' | 'restablecer' | 'bloquear' | 'desbloquear' | 'eliminar';
  userId?: string;
  email?: string;
  password?: string;
  fullName?: string;
  role?: 'Admin' | 'Credit_Officer' | 'Cashier' | 'Collector' | 'Gerente'; // ajusta a tus roles
}

export async function POST(request: Request) {
  const supabaseAdmin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // 1) autenticar al solicitante
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !userData.user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  // 2) confirmar que es Admin de SU empresa
  const { data: perfil } = await supabaseAdmin.from('profiles')
    .select('role, company_id').eq('id', userData.user.id).single();
  if (perfil?.role !== 'Admin') {
    return NextResponse.json({ error: 'Solo los Administradores pueden gestionar usuarios.' }, { status: 403 });
  }
  const empresaId = perfil.company_id;

  // 3) helper: todo userId que se vaya a tocar debe pertenecer a esta empresa
  const perteneceALaEmpresa = async (userId: string) => {
    const { data } = await supabaseAdmin.from('profiles').select('company_id').eq('id', userId).single();
    return data?.company_id === empresaId;
  };

  const peticion: Peticion = await request.json();
  switch (peticion.accion) {
    case 'listar': /* ver 2.3 */ break;
    case 'crear': /* ver 2.4 */ break;
    case 'restablecer':
    case 'bloquear':
    case 'desbloquear':
    case 'eliminar':
      // los 4: validar `perteneceALaEmpresa(peticion.userId)` ANTES de actuar
      break;
  }
}
```

Puntos que no te puedes saltar:

- **Rate limit** por IP en la ruta (`rateLimit(`admin-usuarios:${ip}`, 30, 60_000)`)
  — es una ruta que crea cuentas y cambia contraseñas, blanco obvio de abuso.
- **Un Admin nunca puede tocar a nadie fuera de `perfil.company_id`** — ni
  ver, ni bloquear, ni borrar. Se verifica en cada acción, no solo al listar.
- **No puede bloquearse ni eliminarse a sí mismo** (`peticion.userId ===
  solicitanteId`) — evita que el único Admin se deje sin acceso por error.
- **Longitud mínima de contraseña** consistente en toda la app (una
  constante compartida, ej. `PASSWORD_MIN_LENGTH = 8`), validada en el
  server, no solo en el input del formulario.

### 2.3 Listar usuarios (cruzar Auth + `profiles`)

`supabase.auth.admin.listUsers()` lista usuarios de **todo el proyecto**
(Supabase Auth no tiene noción de tenant). Por eso siempre se filtra
después, cruzando contra `profiles.company_id`:

```ts
const { data: usuarios } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
const { data: perfiles } = await supabaseAdmin.from('profiles')
  .select('id, full_name, role, username')
  .eq('company_id', empresaId);
const porId = new Map(perfiles.map((p) => [p.id, p]));

return usuarios.users
  .filter((u) => porId.has(u.id))          // solo los de esta empresa
  .map((u) => ({
    id: u.id,
    email: u.email,
    fullName: porId.get(u.id)?.full_name ?? u.email,
    role: porId.get(u.id)?.role ?? 'Collector',
    bloqueado: !!u.banned_until && new Date(u.banned_until) > new Date(),
    creado: u.created_at,
  }));
```

### 2.4 Crear usuario (correo opcional → se genera)

Para operarios de campo (cobradores, cajeros) que no siempre tienen correo,
se permite crear el usuario **sin email**: se genera uno interno
(`nombre.apellido@tudominio.local`), y si ya existe se le agrega un sufijo
numérico y se reintenta una vez.

```ts
const crear = (correo: string) => supabaseAdmin.auth.admin.createUser({
  email: correo,
  password: peticion.password!,
  email_confirm: true,
  user_metadata: {
    full_name: peticion.fullName,
    role: peticion.role ?? 'Collector',
    company_id: empresaId,   // SIEMPRE la del Admin que crea -- nunca la del body
  },
});
```

`company_id` va en `user_metadata` porque el trigger `handle_new_user()`
(ver la guía de multi-tenant, sección 4) lo lee de ahí al crear la fila en
`profiles`. **Nunca confíes en un `companyId` que venga del body del
request** — siempre usa el de la sesión del Admin autenticado.

### 2.5 Acciones sobre un usuario existente

`restablecer` (nueva contraseña), `bloquear` (`ban_duration: '87600h'`
≈ 10 años, no hay "ban permanente" nativo), `desbloquear`
(`ban_duration: 'none'`), `eliminar` (`auth.admin.deleteUser`) — las cuatro
siguen el mismo esqueleto: validar `userId` presente → validar que
pertenece a la empresa → ejecutar → devolver `{ ok: true }`.

### 2.6 Frontend de la pestaña

Formulario simple que llama al API route con `fetch('/api/admin-usuarios',
{ method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` },
body: JSON.stringify({ accion: 'crear', ... }) })`. La tabla de usuarios se
recarga después de cada acción (`accion: 'listar'`). No hace falta
Context/estado global para esto — es una pantalla aislada que solo Admin
visita.

---

## 3. Pestaña "Permisos por Rol" (la matriz configurable)

Esta parte sí es 100% Supabase client-side (no necesita API route) porque
`module_permissions` ya tiene RLS que exige `Admin` + `company_id` propio —
ver sección 6 de la guía de multi-tenant.

> **Nota (CRM Seguros)**: esta pestaña no aplica al modelo actual del
> proyecto — solo hay dos roles (`Admin` dentro de su empresa, `Manager` de
> plataforma) y `Admin` siempre tiene acceso total, así que no existe una
> matriz de permisos configurable ni la tabla `module_permissions`. Si en
> el futuro se necesitan roles más granulares dentro de una empresa, esta
> sección describe exactamente cómo agregarlos.

### 3.1 Tipos compartidos

```ts
// types/index.ts
export type UserRole = 'Admin' | 'Credit_Officer' | 'Cashier' | 'Collector' | 'Manager';
export type AccessLevel = 'none' | 'view' | 'edit';

// Un ModuleKey por cada pantalla/sección que se pueda restringir.
// Agregar una pantalla nueva a la app = agregar su key acá.
export type ModuleKey = 'dashboard' | 'clients' | 'loans' | 'cashier' | 'reports' | /* ... */ string;

export interface ModulePermission {
  role: UserRole;
  module: ModuleKey;
  accessLevel: AccessLevel;
}
```

### 3.2 Hook central (en el Context global, no en el componente)

Vive en el mismo Context que ya carga el resto del estado de la app, para
que **cualquier** componente (el layout raíz, el sidebar, cada página)
pueda preguntar "¿puedo ver/editar esto?" sin volver a pedir los datos:

```ts
// context/LoanSystemContext.tsx
const getAccessLevel = useCallback((module: ModuleKey): AccessLevel => {
  if (state.currentRole === 'Admin') return 'edit';   // Admin nunca pasa por la tabla
  const permiso = modulePermissions.find((p) => p.role === state.currentRole && p.module === module);
  return permiso?.accessLevel ?? 'none';               // sin fila = sin acceso
}, [state.currentRole, modulePermissions]);

const puedeVer = useCallback((m: ModuleKey) => getAccessLevel(m) !== 'none', [getAccessLevel]);
const puedeEditar = useCallback((m: ModuleKey) => getAccessLevel(m) === 'edit', [getAccessLevel]);

const guardarPermiso = async (role: UserRole, module: ModuleKey, accessLevel: AccessLevel) => {
  if (!profile?.companyId) return false;
  const { error } = await supabase.from('module_permissions').upsert(
    { company_id: profile.companyId, role, module, access_level: accessLevel },
    { onConflict: 'company_id,role,module' },
  );
  if (error) return false;
  resetData();   // recarga modulePermissions para que el cambio se refleje al instante
  return true;
};
```

Decisiones de diseño a replicar:

- **`Admin` nunca consulta la tabla** — siempre `edit`, hardcodeado en la
  primera línea de `getAccessLevel`. Así nunca queda "accidentalmente sin
  acceso" por una fila mal guardada o faltante.
- **Sin fila = `'none'`** (bloqueado), no `'view'`. El default es
  restrictivo — si agregas un módulo nuevo y todavía no sembraste sus
  permisos, por defecto nadie más que Admin lo ve, en vez de exponerlo sin
  querer. (Si necesitas un comportamiento distinto para un caso puntual,
  hazlo explícito en el componente, como en `nivelRestriccionDe`/
  `nivelEdicionDe` de `PermisosPanel.tsx`, que documentan *por qué* ese
  módulo en particular asume `'view'`/`'edit'` por defecto en vez de
  `'none'`.)

### 3.3 Componente de la matriz (tabla rol × módulo)

```tsx
// components/config/PermisosPanel.tsx
const roles: { role: UserRole; label: string }[] = [
  { role: 'Credit_Officer', label: 'Oficial de Crédito' },
  { role: 'Cashier', label: 'Cajero/a' },
  { role: 'Collector', label: 'Cobrador' },
  // Admin y el rol de plataforma NO van aquí -- no tienen fila en module_permissions
];

const modulos: { module: ModuleKey; label: string }[] = [
  { module: 'dashboard', label: 'Dashboard' },
  { module: 'clients', label: 'Clientes' },
  // ... una entrada por cada pantalla que tenga sentido restringir
];

export default function PermisosPanel() {
  const { modulePermissions, guardarPermiso } = useLoanSystem();
  const [guardando, setGuardando] = useState<string | null>(null);

  const nivelDe = (role: UserRole, module: ModuleKey): AccessLevel =>
    modulePermissions.find((p) => p.role === role && p.module === module)?.accessLevel ?? 'none';

  const handleCambiar = async (role: UserRole, module: ModuleKey, accessLevel: AccessLevel) => {
    setGuardando(`${role}:${module}`);
    await guardarPermiso(role, module, accessLevel);
    setGuardando(null);
  };

  return (
    <table>
      <thead><tr><th /> {roles.map((r) => <th key={r.role}>{r.label}</th>)}</tr></thead>
      <tbody>
        {modulos.map(({ module, label }) => (
          <tr key={module}>
            <td>{label}</td>
            {roles.map(({ role }) => (
              <td key={role}>
                <select
                  value={nivelDe(role, module)}
                  disabled={guardando === `${role}:${module}`}
                  onChange={(e) => void handleCambiar(role, module, e.target.value as AccessLevel)}
                >
                  <option value="none">Bloqueado</option>
                  <option value="view">Ver</option>
                  <option value="edit">Editar</option>
                </select>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Cada `<select>` guarda al cambiar (no hay botón "Guardar" aparte) — el
cambio de plan/permiso es inmediato y visible de una vez, con un
`disabled` puntual en la celda que se está guardando para que no se pueda
doble-click mientras viaja la petición.

**Extensión opcional, si tu dominio tiene datos sensibles puntuales** (en
KaiCredit: montos de interés): en vez de bloquear el módulo entero, se
puede tener `ModuleKey`s extra tipo `'reports_interes'` que no controlan
navegación sino que ocultan un dato específico dentro de una pantalla que
el rol sí puede ver. Mismo mecanismo (`module_permissions` + `puedeVer`),
solo que el componente que pinta ese dato hace
`puedeVer('reports_interes') ? <Monto/> : null` en vez de decidir si se
navega o no a la ruta.

---

## 4. Enganchar la matriz al resto de la app

### 4.1 Sidebar / menú de navegación

El menú filtra sus propios ítems con el mismo `puedeVer`:

```tsx
// components/layout/Sidebar.tsx
const { puedeVer } = useLoanSystem();
const itemsVisibles = items.filter((item) =>
  item.module ? puedeVer(item.module) : true,   // ítems sin `module` = siempre visibles (ej. logout)
);
```

### 4.2 Route guard en el layout raíz (la parte que de verdad protege)

Un link oculto no es seguridad — alguien puede escribir la URL a mano. El
layout raíz de la app debe redirigir si la ruta actual no está permitida
para el rol actual:

```tsx
// components/layout/AppShell.tsx
useEffect(() => {
  if (currentRole === 'Admin') return;           // Admin: acceso total, sin guard de módulo
  const match = moduleRoutes.find(([route]) => pathname.startsWith(route));
  const permitido = !!match && puedeVer(match[1]);
  if (!permitido) {
    const fallback = moduleRoutes.find(([, module]) => puedeVer(module));
    router.replace(fallback ? fallback[0] : '/login');
  }
}, [pathname, currentRole, puedeVer]);
```

`moduleRoutes` es una lista `[ruta, ModuleKey][]` — el mapeo entre URL y
qué módulo de la matriz la controla. Cuidado con el orden: rutas más
específicas primero (`/loans/simulator` antes que `/loans`), o el prefijo
genérico las captura primero.

### 4.3 Qué NO reemplaza esta matriz

Repetirlo en la UI del propio panel de permisos, para que el Admin lo
entienda: esta matriz controla navegación y botones — **no** reemplaza las
políticas RLS ni las funciones `SECURITY DEFINER` que protegen cada
operación sensible en la base de datos (aprobar un préstamo, registrar un
pago, etc. siguen validando el rol server-side, independientemente de lo
que diga esta tabla). Si algún día hay un bug en el frontend que deje
pasar a alguien a una pantalla que no debería ver, la base de datos sigue
rechazando cualquier escritura que su rol no tenga permitida.

---

## 5. Sembrar los permisos por defecto al crear una empresa

Para que activar esta matriz no le quite el acceso a nadie de golpe (en un
proyecto que ya tenía roles hardcodeados en el código), y para que toda
empresa nueva arranque con algo sensato:

```sql
CREATE OR REPLACE FUNCTION public.sembrar_permisos_default(p_company uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  INSERT INTO module_permissions (company_id, role, module, access_level)
  VALUES
    (p_company, 'Credit_Officer', 'dashboard', 'view'),
    (p_company, 'Credit_Officer', 'clients', 'edit'),
    (p_company, 'Cashier', 'cashier', 'edit'),
    (p_company, 'Collector', 'collector', 'edit')
    -- ... reproduce lo que hoy está hardcodeado por rol en el código
  ON CONFLICT (company_id, role, module) DO NOTHING;
$function$;
```

Se llama una vez por cada empresa existente (migración de backfill) y
**dentro de `provisionar_empresa()`** para que toda empresa nueva la tenga
desde el día uno (ver sección 5 de la guía de multi-tenant).

---

## 6. Checklist para construir este módulo en un proyecto nuevo

1. Ya tienes `module_permissions` con RLS (guía de multi-tenant, sección 6).
2. `types`: `UserRole`, `AccessLevel = 'none'|'view'|'edit'`, `ModuleKey`
   (uno por pantalla/sección restringible), `ModulePermission`.
3. Context global: cargar `modulePermissions` de la empresa actual junto
   con el resto del estado; exponer `puedeVer`, `puedeEditar`,
   `guardarPermiso` (Admin siempre `'edit'`, sin fila = `'none'`).
4. `components/config/PermisosPanel.tsx` — tabla rol × módulo, un
   `<select>` por celda, guarda al cambiar (upsert por `company_id, role,
   module`).
5. Sidebar/menú: filtra ítems con `puedeVer`.
6. Layout raíz: route guard con `useEffect` que redirige si `!puedeVer`
   para la ruta actual — la parte que de verdad importa, el menú oculto
   es solo cosmético.
7. `app/api/admin-usuarios/route.ts` — un solo POST con `accion` como
   discriminador (`listar/crear/restablecer/bloquear/desbloquear/eliminar`),
   `service_role` key, siempre acotado a `company_id` del Admin que llama,
   rate-limited, contraseña mínima validada server-side.
8. `sembrar_permisos_default(company_id)` — se llama al provisionar cada
   empresa nueva y, si es un proyecto existente, una vez por backfill.
9. Pantalla de Configuración: un botón "Usuarios" (solo visible para
   Admin) que abre un modal/panel con dos pestañas: Usuarios del Sistema
   (habla con el API route) y Permisos por Rol (habla directo a Supabase
   vía RLS, sin API route).

---

## Referencias en este repo

- `app/api/admin-usuarios/route.ts` — CRUD de usuarios vía Admin API.
- `components/config/PermisosPanel.tsx` — matriz rol × módulo completa.
- `context/LoanSystemContext.tsx` — `puedeVer`/`puedeEditar`/`guardarPermiso`/carga de `modulePermissions`.
- `components/layout/Sidebar.tsx` — filtrado del menú por `puedeVer`.
- `components/layout/AppShell.tsx` — route guard por rol (y por plan, ver la otra guía).
- `app/config/page.tsx` — dónde se monta todo (modal "Usuarios y Permisos").
- `supabase/migrations/fase47_permisos_por_modulo.sql` — tabla, RLS y `sembrar_permisos_default`.
- Ver también: [MULTI-EMPRESA-Y-ROLES.md](MULTI-EMPRESA-Y-ROLES.md) — la base de datos detrás de todo esto.
