# Patrón Multi-Empresa (Multi-Tenant) + Roles — KaiCredit RD

Guía de referencia para replicar en otros proyectos el sistema de multi-tenancy
(varias empresas/clientes sobre la misma base de datos) y de roles/permisos
que usa KaiCredit RD. Es el patrón real usado en producción, no un genérico
de libro de texto — extraído de `supabase/migrations/fase28..fase71` y del
frontend (`context/AuthContext.tsx`, `components/layout/AppShell.tsx`,
`context/LoanSystemContext.tsx`).

Stack asumido: Next.js (client components) + Supabase (Postgres + Auth + RLS).
Si el otro proyecto usa otro backend, la idea central (aislar filas por
`company_id` + RLS a nivel de base de datos, nunca solo en el frontend) se
traslada igual a cualquier motor con Row-Level Security o su equivalente.

---

## 1. Idea central

**Nunca confíes en el frontend para aislar los datos de cada cliente.** Todo
el aislamiento vive en la base de datos vía Row-Level Security (RLS), para
que aunque alguien manipule las peticiones desde el navegador, Postgres
rechace cualquier fila que no sea de su propia empresa. El frontend solo usa
esto para no *mostrar* lo que el usuario no puede ver — la seguridad real
está en el motor.

Tres capas, de más a menos estricta:

1. **RLS por `company_id`** — nadie ve ni escribe filas de otra empresa. Innegociable.
2. **Funciones `SECURITY DEFINER` con validación explícita** — para operaciones
   compuestas (ej. registrar un pago que toca 3 tablas a la vez) que no se
   pueden expresar bien solo con políticas RLS declarativas.
3. **Matriz de permisos por rol (UI)** — controla qué ve/edita cada rol
   *dentro* de su propia empresa. No es seguridad, es UX (aunque las
   funciones `SECURITY DEFINER` sí validan el rol server-side para las
   operaciones sensibles).

---

## 2. Modelo de datos

```sql
-- Tabla raíz: una fila por cliente/empresa que usa el sistema
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,   -- desactivar sin borrar datos
  plan_id text REFERENCES plan_definiciones(id),  -- si hay planes de pago
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cada usuario pertenece a una empresa (o a ninguna, si es rol "plataforma")
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  company_id uuid REFERENCES companies(id),  -- NULL solo para el rol Manager
  role user_role NOT NULL,
  full_name text,
  username text UNIQUE
);
```

**Todas** las tablas de negocio (clientes, ventas, pagos, lo que sea del
dominio) llevan su propia columna `company_id uuid NOT NULL REFERENCES
companies(id)`. No hay una tabla "compartida" a medias — o es de la empresa,
o es catálogo global de plataforma (ej. `plan_definiciones`, que es de
lectura pública y solo el rol de plataforma la edita).

---

## 3. La función bisagra: `current_user_company_id()`

Todo el sistema de RLS gira en torno a una función que resuelve "¿a qué
empresa pertenece quien está haciendo esta consulta ahora mismo?":

```sql
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;
```

Y su hermana para el rol:

```sql
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
```

`SECURITY DEFINER` es necesario porque la propia tabla `profiles` tiene RLS
activado — sin esto habría una dependencia circular (para leer `profiles`
necesitarías ya saber tu company_id).

Cada política RLS de cada tabla de negocio, sin excepción, incluye
`company_id = current_user_company_id()` además de la condición de rol:

```sql
CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated
  USING (company_id = current_user_company_id());

CREATE POLICY "clients_write_admin" ON clients FOR ALL TO authenticated
  USING (current_user_role() IN ('Admin','Credit_Officer') AND company_id = current_user_company_id())
  WITH CHECK (current_user_role() IN ('Admin','Credit_Officer') AND company_id = current_user_company_id());
```

**Truco útil si ya tienes políticas sin multi-tenant y necesitas agregarlas
en bloque:** un `DO $$ ... $$` que recorre `pg_policies`, toma el `qual`/
`with_check` de cada política existente y les concatena `AND company_id =
current_user_company_id()` antes de recrearlas. Migración de referencia:
`fase28_multi_tenant_rls.sql`. Sirve para migrar un proyecto de un solo
tenant a multi-tenant sin reescribir cada política a mano.

---

## 4. Roles

```sql
CREATE TYPE user_role AS ENUM (
  'Admin',           -- dueño de SU empresa, acceso total dentro de ella
  'Manager',         -- rol de PLATAFORMA (nosotros), no pertenece a ninguna empresa
  'Credit_Officer',  -- rol operativo de negocio (ajustar al dominio)
  'Cashier',
  'Collector'
);
```

Puntos clave de este diseño de roles:

- **`Manager` es distinto a todo lo demás**: no tiene `company_id` (vive
  fuera del multi-tenant), y es quien puede *crear* empresas nuevas, ver
  la tabla `companies` completa, y editar el catálogo de planes. Ningún
  otro rol puede ver esa tabla — ni falta le hace, porque nunca necesita
  datos de otra empresa.
- **`Admin`** siempre tiene acceso total *dentro de su empresa* — no pasa
  por la matriz de permisos configurable (ver sección 6). Es el único rol
  que puede gestionar usuarios de su empresa.
- Agregar un rol nuevo al enum es `ALTER TYPE user_role ADD VALUE`, y
  **debe ir en su propia transacción**, separado de cualquier migración que
  ya use ese valor nuevo (Postgres no permite usar un valor de enum recién
  agregado en la misma transacción que lo crea).

### Alta de usuarios

`handle_new_user()` (trigger `AFTER INSERT ON auth.users`) crea la fila en
`profiles` leyendo `role` y `company_id` desde `raw_user_meta_data` — esos
valores los pone el API route del backend (nunca el cliente), usando el
Supabase Admin API con la `service_role` key:

```ts
await supabaseAdmin.auth.admin.createUser({
  email, password,
  user_metadata: { role: 'Cashier', company_id: empresaDelAdminQueCrea },
});
```

Si no vienen `role`/`company_id` explícitos, cae a `'Collector'` sin
empresa — lo cual falla fuerte contra el CHECK/RLS en vez de asumir
silenciosamente un default incorrecto. Preferible a "fallar en silencio".

`proteger_ultimo_admin()` (trigger) impide degradar/borrar al último Admin
**de esa empresa** — el chequeo es por `company_id`, no global.

---

## 5. Provisionar una empresa nueva

Una sola función que arma todo lo que una empresa necesita para operar desde
el día uno (catálogo contable base, configuración operativa por defecto,
matriz de permisos por defecto):

```sql
CREATE OR REPLACE FUNCTION public.provisionar_empresa(p_nombre text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_company uuid;
BEGIN
  IF current_user_role() <> 'Manager' THEN
    RAISE EXCEPTION 'Solo el Manager puede crear empresas.';
  END IF;

  INSERT INTO companies (name) VALUES (trim(p_nombre)) RETURNING id INTO v_company;

  -- catálogo/base mínima que toda empresa necesita
  INSERT INTO accounts (company_id, code, name, type) VALUES (...);
  INSERT INTO app_settings (company_id, id, value) VALUES (...);
  PERFORM sembrar_permisos_default(v_company);

  RETURN v_company;
END;
$function$;
```

El primer usuario Admin de la empresa se crea **aparte**, desde el API route
(porque necesita la Admin API de Supabase Auth, que no vive dentro de una
función de Postgres).

Desactivar una empresa (sin borrar sus datos) es solo `companies.active =
false` + una política RLS que también exige `active = true` en las tablas
sensibles, o un chequeo en el login. Nunca DELETE en cascada como método de
"apagar" un cliente.

---

## 6. Permisos configurables por rol y módulo (dentro de una empresa)

Además de RLS (que es seguridad dura, por empresa), hay una capa de UX:
una matriz `(empresa, rol, módulo) -> nivel de acceso` que el propio Admin
de cada empresa edita desde su panel, sin tocar código:

```sql
CREATE TYPE access_level AS ENUM ('none', 'view', 'edit');

CREATE TABLE module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  module text NOT NULL,
  access_level access_level NOT NULL DEFAULT 'none',
  UNIQUE (company_id, role, module)
);

-- Solo el Admin de la empresa la edita; todos la leen (para pintar su propio menú)
CREATE POLICY module_permissions_select ON module_permissions
  FOR SELECT USING (company_id = current_user_company_id());
CREATE POLICY module_permissions_write ON module_permissions
  FOR ALL USING (company_id = current_user_company_id() AND current_user_role() = 'Admin')
  WITH CHECK (company_id = current_user_company_id() AND current_user_role() = 'Admin');
```

`Admin` y `Manager` **no** tienen filas aquí a propósito: Admin siempre es
`edit` en todo dentro de su empresa, Manager no pertenece a ninguna. Al
provisionar una empresa nueva se siembra una matriz por defecto
(`sembrar_permisos_default`) que reproduce los permisos "de fábrica" de cada
rol, para no dejar a nadie sin acceso el día que se activa esta matriz.

En el frontend, un solo hook centraliza la consulta:

```ts
const puedeVer = (module: ModuleKey) => getAccessLevel(module) !== 'none';
const puedeEditar = (module: ModuleKey) => getAccessLevel(module) === 'edit';
```

Y el layout raíz (`AppShell`) usa `puedeVer` para el *route guard*: si el
usuario navega a una URL que su rol no puede ver, lo redirige — no confía en
que el link simplemente no aparezca en el menú.

**Importante:** esta tabla es solo para pintar la UI. Las operaciones que
importan de verdad (registrar un pago, aprobar algo, borrar un usuario)
**siguen validando el rol dentro de la función `SECURITY DEFINER` misma**
(ver sección 7) — nunca confíes en que "no se ve el botón" equivalga a "no
se puede hacer la petición".

---

## 7. Funciones `SECURITY DEFINER` para operaciones compuestas

Cuando una acción del usuario toca varias tablas a la vez (ej. registrar un
pago → actualiza la cuota, inserta el pago, inserta el movimiento de caja),
no se modela bien solo con políticas RLS declarativas. Se usa una función
`SECURITY DEFINER` que:

1. Valida el rol explícitamente al inicio.
2. Verifica que el recurso que se va a tocar (`loan_id`, `client_id`, etc.)
   pertenezca a `current_user_company_id()` — **aunque la tabla ya tenga
   RLS**, porque dentro de una función `SECURITY DEFINER` las políticas RLS
   del llamador no aplican (corre con los privilegios del dueño de la
   función, no del usuario).
3. Hace todos los INSERT/UPDATE relacionados, estampando `company_id`
   explícitamente en cada fila nueva (nunca asumas que un default o un
   trigger lo va a poner bien).

```sql
CREATE OR REPLACE FUNCTION public.registrar_pago(...)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_company uuid;
BEGIN
  IF current_user_role() NOT IN ('Admin', 'Cashier', 'Collector') THEN
    RAISE EXCEPTION 'No autorizado para registrar pagos.';
  END IF;

  SELECT company_id INTO v_company FROM loans WHERE id = p_loan;
  IF v_company <> current_user_company_id() THEN
    RAISE EXCEPTION 'Préstamo no pertenece a su empresa.';
  END IF;

  INSERT INTO payments (..., company_id) VALUES (..., v_company);
  -- resto de la operación, todo con v_company explícito
END;
$function$;
```

Regla general: **toda función `SECURITY DEFINER` que toque tablas
multi-tenant empieza validando rol + empresa del recurso, antes de tocar
nada.** Es el patrón que se repite literalmente en cada función del
proyecto (`registrar_pago`, `guardar_gps_cliente`, `registrar_pago_alquiler`,
`activar_modulo`, etc.) — cópialo tal cual para cualquier RPC nueva.

Para funciones que corren por cron / service role y necesitan iterar
**todas** las empresas (ej. un backup diario, un cálculo de mora nocturno),
el candado es al revés — solo el `service_role` puede llamarlas:

```sql
CREATE OR REPLACE FUNCTION public.exportar_backup_todas_empresas()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;
  -- FOR v_company IN SELECT id FROM companies LOOP ... END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.exportar_backup_todas_empresas() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.exportar_backup_todas_empresas() TO service_role;
```

---

## 8. Planes de suscripción + límites duros (opcional, si el SaaS cobra por plan)

Si el multi-tenant es también un SaaS con planes de pago, dos tablas
separan **qué incluye cada plan** de **cómo se factura**:

```sql
CREATE TABLE plan_definiciones (
  id text PRIMARY KEY,           -- slug: 'arranque', 'crecimiento', ...
  nombre text NOT NULL,
  precio_mensual numeric(10,2) NOT NULL DEFAULT 0,
  max_usuarios int,              -- NULL = ilimitado
  max_prestamos int,
  max_clientes int,
  ...
);

CREATE TABLE plan_modulos (
  plan_id text REFERENCES plan_definiciones(id) ON DELETE CASCADE,
  modulo_id text NOT NULL,       -- catálogo de módulos vive en código (frontend)
  incluido boolean NOT NULL DEFAULT true,
  PRIMARY KEY (plan_id, modulo_id)
);
```

- Lectura **pública** (`USING (true)`) para que la landing muestre precios
  sin sesión iniciada. Escritura solo `Manager`.
- El catálogo de *ids* de módulo (`'clientes'`, `'pos'`, `'reportes'`, ...)
  vive en código del frontend (`lib/planes.ts: MODULOS_CATALOGO`), no en la
  base de datos — agregar un módulo de verdad requiere construirlo en la
  app de todas formas, así que no tiene sentido que el Manager lo "cree"
  desde un panel. Lo que sí edita sin tocar código es *si un plan dado lo
  incluye*.
- Una empresa sin `plan_id`, o con un plan "personalizado" (sin fila en
  `plan_definiciones`), queda **sin límite** — casos especiales negociados
  aparte por la plataforma.

### Enforcement real (no solo mostrar el límite, bloquearlo)

Un límite que solo se valida en el navegador se salta con una petición
directa. El límite duro va con un **trigger `BEFORE INSERT`**:

```sql
CREATE OR REPLACE FUNCTION public.verificar_limite_clientes()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE v_max int; v_actual int;
BEGIN
  SELECT pd.max_clientes INTO v_max
  FROM companies c JOIN plan_definiciones pd ON pd.id = c.plan_id
  WHERE c.id = new.company_id;

  IF v_max IS NOT NULL THEN
    SELECT count(*) INTO v_actual FROM clients WHERE company_id = new.company_id;
    IF v_actual >= v_max THEN
      RAISE EXCEPTION 'Alcanzó el límite de % clientes de su plan.', v_max;
    END IF;
  END IF;
  RETURN new;
END;
$function$;

CREATE TRIGGER trg_verificar_limite_clientes
  BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION public.verificar_limite_clientes();
```

Mismo patrón para `loans` (contar solo estados "activos", no todo el
histórico) y para usuarios (el chequeo va **dentro de `handle_new_user()`**,
antes del INSERT en `profiles`, para que si falla revierta también la
creación en `auth.users` — el trigger de auth es `AFTER INSERT`, así que una
excepción aquí deshace toda la transacción y no deja un usuario huérfano en
Auth sin perfil).

### Bloqueo de módulos por plan en el frontend

El frontend combina **dos** guards independientes en el layout raíz:

1. Rol → qué rutas/módulos puede ver ese rol (sección 6).
2. Plan → qué módulos incluye el plan de la empresa, **aplica incluso al
   Admin** (un Admin en el plan más barato no puede entrar a "Contabilidad"
   si su plan no la incluye, así tenga rol de acceso total).

```ts
const PLAN_GATE_ROUTES: [string, string][] = [
  ['/accounting', 'contabilidad'],
  ['/reports', 'reportes'],
  // ...
];

function moduloBloqueadoPorPlan(pathname: string, modulosPlan: Record<string, boolean> | null): boolean {
  if (!modulosPlan) return false; // sin plan asignado = sin restricción
  const match = PLAN_GATE_ROUTES.find(([route]) => pathname.startsWith(route));
  return !!match && modulosPlan[match[1]] === false;
}
```

El guard de plan se evalúa **antes** que el guard de rol en el layout, para
no dejar pasar una pantalla bloqueada mientras el rol todavía la permitiría.

---

## 9. Checklist para replicar esto en un proyecto nuevo

1. `companies` (o `tenants`/`organizations`, el nombre que prefieras) +
   `active boolean` + `plan_id` si vas a cobrar por plan.
2. `profiles.company_id` (NULL solo para el/los roles de plataforma).
3. `current_user_company_id()` y `current_user_role()` como funciones SQL
   `STABLE SECURITY DEFINER`.
4. Cada tabla de negocio: columna `company_id NOT NULL REFERENCES
   companies(id)` + políticas RLS con `company_id = current_user_company_id()`
   en TODAS (select/insert/update/delete).
5. `user_role` como ENUM con un rol de plataforma separado (sin
   `company_id`) que sea el único que ve/crea filas en `companies`.
6. Toda función `SECURITY DEFINER` que toque una tabla de negocio: valida
   rol al inicio + verifica que el recurso pertenezca a
   `current_user_company_id()` antes de tocar nada, aunque la tabla ya
   tenga RLS (RLS del llamador no aplica dentro de `SECURITY DEFINER`).
7. Función `provisionar_empresa()` que arma en una sola llamada todo lo que
   una empresa nueva necesita (catálogo base, config por defecto, permisos
   por defecto) — para que crear un cliente nuevo sea un solo paso atómico.
8. (Opcional) Matriz `module_permissions (company_id, role, module,
   access_level)` editable por el Admin de cada empresa, con Admin/rol de
   plataforma excluidos porque ya tienen acceso total por definición.
9. (Opcional, si hay planes de pago) `plan_definiciones` + `plan_modulos`
   de lectura pública, más triggers `BEFORE INSERT` que hagan cumplir los
   límites (`max_usuarios`/lo que aplique) **en la base de datos**, no solo
   en el frontend.
10. En el frontend: un único layout raíz que aplique, en este orden, (a) si
    hay sesión, (b) si el plan bloquea la ruta, (c) si el rol permite la
    ruta — y redirija, no solo oculte el link del menú.

---

## Referencias en este repo

- `supabase/migrations/fase28_multi_tenant_rls.sql` — reescritura de RLS existente a multi-tenant.
- `supabase/migrations/fase29_multi_tenant_funciones.sql` — funciones `SECURITY DEFINER` adaptadas.
- `supabase/migrations/fase30_multi_tenant_provisionamiento.sql` — `provisionar_empresa`, rol Manager.
- `supabase/migrations/fase47_permisos_por_modulo.sql` — matriz de permisos configurable.
- `supabase/migrations/fase70_catalogo_planes_editable.sql` — catálogo de planes editable.
- `supabase/migrations/fase71_enforcement_planes.sql` — límites duros por plan (triggers).
- `context/AuthContext.tsx`, `components/layout/AppShell.tsx` — guards de sesión/rol/plan en frontend.
- `context/LoanSystemContext.tsx` — `puedeVer`/`puedeEditar`/`guardarPermiso`.
- `lib/planes.ts` — catálogo de módulos y helpers de plan en frontend.
