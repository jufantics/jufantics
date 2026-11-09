# Backend seguro de JUFANTICS

Esta carpeta prepara la migración del prototipo local a cuentas reales con Supabase Auth, PostgreSQL con RLS y Storage privado.

## Orden de activación

1. Crear un proyecto Supabase.
2. Ejecutar `schema.sql` en SQL Editor.
3. Ejecutar `migrations/20261106_accounts_payments.sql` para solicitudes privadas, administración y registro de operaciones.
4. Configurar Site URL como `https://jufantics.github.io/jufantics/mundo-cuentos/cuenta.html` y añadir la misma ruta a Redirect URLs.
5. En Authentication > Users, crear o confirmar `jufantics@gmail.com` y `lpberrospia@gmail.com` sin compartir sus contraseñas.
6. Ejecutar `seed_accounts.sql`.
7. Ejecutar `verify_accounts.sql` y comprobar que las dos primeras columnas muestran `OK` y que el límite del plan también sea `OK`.
8. La configuración pública del navegador usa únicamente Project URL y publishable key. Nunca incluir una secret key.
9. Migrar las páginas de los trece cuentos premium al bucket privado `premium-stories`.
10. Retirar esas páginas de `assets/cuentos` antes de habilitar cobros.

La migración `20261106_accounts_payments.sql` es idempotente: puede volver a ejecutarse para instalar sus funciones corregidas. Al cambiar una familia de anual a mensual, conserva el perfil infantil más antiguo y desactiva los adicionales sin borrarlos.

## Datos que faltan para completar la activación

- Confirmación de que ambas invitaciones fueron aceptadas.
- Alias de los dos perfiles menores para la cuenta anual de prueba.

La clave secreta o `service_role` solo se utiliza en un servidor seguro o en el panel de Supabase. Nunca debe incluirse en JavaScript público.
