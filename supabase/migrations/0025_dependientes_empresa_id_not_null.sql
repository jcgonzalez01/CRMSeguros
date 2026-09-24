-- dependientes.empresa_id quedó nullable por descuido en 0024 (a
-- diferencia de toda otra tabla de negocio); la tabla está vacía
-- (recién creada), así que se corrige directo a not null.
alter table dependientes alter column empresa_id set not null;
