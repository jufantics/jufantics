# Backend seguro de JUFANTICS

Esta carpeta prepara la migración del prototipo local a cuentas reales con Supabase Auth, PostgreSQL con RLS y Storage privado.

## Orden de activación

1. Crear un proyecto Supabase.
2. Ejecutar `schema.sql` en SQL Editor.
3. Configurar Site URL como `https://jufantics.github.io/jufantics/mundo-cuentos/` y añadir la misma ruta a Redirect URLs.
4. En Authentication > Users, invitar `jufantics@gmail.com` y `lpberrospia@gmail.com`.
5. Ejecutar `seed_accounts.sql`.
6. Copiar `mundo-cuentos/auth-config.example.js` como `mundo-cuentos/auth-config.js` y completar URL y clave pública.
7. Migrar las páginas de los trece cuentos premium al bucket privado `premium-stories`.
8. Retirar esas páginas de `assets/cuentos` antes de habilitar cobros.

## Datos que faltan para completar la activación

- URL del proyecto Supabase.
- Clave pública `sb_publishable_...` (no enviar la clave secreta por el chat ni guardarla en GitHub).
- Confirmación de que ambas invitaciones fueron aceptadas.
- Alias de los dos perfiles menores para la cuenta anual de prueba.

La clave secreta o `service_role` solo se utiliza en un servidor seguro o en el panel de Supabase. Nunca debe incluirse en JavaScript público.

