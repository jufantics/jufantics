# Backend seguro de JUFANTICS

Esta carpeta prepara la migración del prototipo local a cuentas reales con Supabase Auth, PostgreSQL con RLS y Storage privado.

## Orden de activación

1. Crear un proyecto Supabase.
2. Ejecutar `schema.sql` en SQL Editor.
3. Ejecutar `migrations/20261106_accounts_payments.sql` para solicitudes privadas, administración y registro de operaciones.
4. Configurar Site URL como `https://jufantics.github.io/jufantics/mundo-cuentos/cuenta.html` y añadir la misma ruta a Redirect URLs.
5. En Authentication > Users, crear o confirmar `jufantics@gmail.com` y `lpberrospia@gmail.com` sin compartir sus contraseñas.
6. Ejecutar `seed_accounts.sql`.
7. La configuración pública del navegador usa únicamente Project URL y publishable key. Nunca incluir una secret key.
8. Migrar las páginas de los trece cuentos premium al bucket privado `premium-stories`.
9. Retirar esas páginas de `assets/cuentos` antes de habilitar cobros.

## Datos que faltan para completar la activación

- Confirmación de que ambas invitaciones fueron aceptadas.
- Alias de los dos perfiles menores para la cuenta anual de prueba.

La clave secreta o `service_role` solo se utiliza en un servidor seguro o en el panel de Supabase. Nunca debe incluirse en JavaScript público.
