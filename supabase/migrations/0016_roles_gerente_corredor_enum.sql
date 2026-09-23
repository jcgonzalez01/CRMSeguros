-- Paso 1 de 2 para agregar los roles de empresa 'Gerente' y 'Corredor'.
-- Postgres no permite usar un valor de enum en la misma transacción en la
-- que se añadió (el valor no es visible hasta que esa transacción hace
-- commit) — como cada archivo de migración de este proyecto es su propia
-- transacción, este archivo SOLO añade los valores; 0017 (migración
-- separada y posterior) ya puede usarlos en policies/triggers.

alter type user_role add value 'Gerente';
alter type user_role add value 'Corredor';
