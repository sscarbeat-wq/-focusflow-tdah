# FocusFlow TDAH

App de hábitos con login y progreso guardado por usuario (Supabase).

## 1. Crear tu proyecto de Supabase (gratis)

1. Entra a https://supabase.com y crea una cuenta.
2. Crea un proyecto nuevo (elige una contraseña de base de datos, guárdala en un lugar seguro).
3. En el menú lateral, ve a **SQL Editor** → pega todo el contenido del archivo `supabase/schema.sql` (dentro de esta misma carpeta del proyecto, en la subcarpeta `supabase/`) → dale "Run". Esto crea la tabla donde se guarda el progreso de cada usuario, con seguridad para que nadie vea el progreso de otro.
4. En el menú lateral ve a **Project Settings → API**. Ahí vas a ver:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (una clave larga)

## 2. Configurar el proyecto en tu computadora

1. Instala Node.js si no lo tienes: https://nodejs.org (elige la versión LTS).
2. Abre una terminal dentro de esta carpeta y corre:
   ```
   npm install
   ```
3. Copia el archivo `.env.example` y renómbralo a `.env`. Ábrelo y reemplaza los dos valores con el **Project URL** y la **anon public key** que copiaste de Supabase.
4. Corre la app en modo de prueba:
   ```
   npm run dev
   ```
5. Abre la dirección que te muestre la terminal (normalmente `http://localhost:5173`). Ahí ya puedes crear una cuenta de prueba y ver que el progreso se guarda si recargas la página.

## 3. Publicar el sitio (Vercel)

1. Sube esta carpeta a un repositorio de GitHub (si nunca lo has hecho, dime y te explico ese paso también).
2. Entra a https://vercel.com, crea una cuenta con tu GitHub, y elige "Import Project" sobre este repositorio.
3. En la configuración del proyecto en Vercel, agrega las mismas dos variables de entorno (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) en la sección **Environment Variables**.
4. Dale "Deploy". En un par de minutos tienes una URL pública (algo como `focusflow-tdah.vercel.app`).
5. Si compraste un dominio propio (ej. en Namecheap), en Vercel ve a **Domains** y sigue las instrucciones para conectarlo.

## 4. Instalarla en un celular (PWA)

Este proyecto ya está configurado para que el celular la trate como una app instalada, con su propio ícono, sin pasar por App Store ni Google Play.

La app ahora también incluye un aviso automático (arriba de la pantalla) que detecta si la persona usa Android o iPhone y le muestra los pasos exactos para instalarla — incluyendo un aviso especial si abre el link desde dentro de TikTok o Instagram (ahí no se puede instalar directo, hay que decirle que toque "Abrir en el navegador" primero).

En Android, además, hay dos accesos directos (mantén presionado el ícono de la app ya instalada): uno abre directo la respiración guiada, otro el freno de impulsividad. En iPhone, Apple no permite estos accesos directos para apps instaladas así, por lo que solo funcionan en Android.

1. Corre `npm install` de nuevo (para bajar el paquete nuevo que agrega esto) y luego `npm run build`. Esto crea una carpeta `dist` con la versión final de la app.
2. Sigue el paso 3 de este README (Publicar el sitio en Vercel) si todavía no lo has hecho. Vercel construye el proyecto automáticamente, no necesitas subir la carpeta `dist` a mano.
3. Una vez que tengas tu URL pública (ej. `focusflow-tdah.vercel.app`), ábrela desde el celular:
   - **Android (Chrome):** vas a ver un botón o mensaje de "Instalar app" en la barra de direcciones o en el menú de tres puntos → "Instalar aplicación".
   - **iPhone (Safari):** dale al botón de compartir (el cuadro con la flecha hacia arriba) → "Agregar a pantalla de inicio".
4. Ya instalada, se abre en pantalla completa, con su ícono, como cualquier otra app del celular.

## 5. Cobrar

Este proyecto ya tiene login y guardado de progreso, que era el paso más importante. Para agregar el cobro con Stripe, el flujo es:

1. Crear una cuenta en https://stripe.com y activar modo de pruebas.
2. Crear un producto con precio recurrente (ej. $5-9 USD/mes) en el panel de Stripe.
3. Agregar un botón que mande al usuario a Stripe Checkout.
4. Agregar un "webhook" (una función pequeña) que, cuando Stripe confirme el pago, marque en la tabla de Supabase que ese usuario tiene acceso activo.
5. En `App.jsx`, revisar ese estado antes de mostrar la app completa.

Dime cuando quieras que armemos esta parte y seguimos con el mismo proyecto.

## 6. Si más adelante quieres subirla a App Store / Google Play

Esta misma base de código se puede empaquetar como app nativa con una herramienta llamada Capacitor, pero ahí el cobro de suscripción tiene que pasar por Apple/Google (con su propia comisión), no por Stripe directo. Vale la pena validar primero con la versión instalable (PWA) antes de dar ese paso — cuando llegue el momento, dime y armamos esa parte.

## Nota sobre lo que se guarda y lo que no

Por ahora se guarda entre sesiones: el XP, el tarro de logros, y los interruptores del rastreador de estilo de vida (sueño, alimentación, movimiento, escritorio). El desglosador de tareas, el cronómetro del auditor de tiempo, y la reestructuración de pensamientos se reinician cada vez que abres la app — son herramientas de uso puntual, no historial que necesite guardarse.

Los interruptores del rastreador tampoco se reinician automáticamente cada día todavía (eso quedaría como una mejora futura, útil para que cada día empiece "en blanco").
