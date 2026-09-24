-- Datos del cliente que suele pedir una póliza de seguro en RD: cédula
-- (identificación, prácticamente obligatoria para emitir cualquier
-- póliza), fecha de nacimiento (vida/salud), dirección (auto/hogar y
-- correspondencia formal), y sexo/estado civil/ocupación (usados por
-- algunas aseguradoras para calcular la prima en vida/salud/accidentes).
-- Todo nullable: son datos que se van completando con el tiempo, no un
-- requisito para registrar un cliente nuevo.

alter table clientes
  add column cedula text,
  add column fecha_nacimiento date,
  add column direccion text,
  add column sexo text check (sexo in ('M', 'F')),
  add column estado_civil text check (
    estado_civil in ('soltero', 'casado', 'divorciado', 'viudo', 'union_libre')
  ),
  add column ocupacion text;
