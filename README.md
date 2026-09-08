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

## 5. Cobrar con Stripe

Este proyecto ya tiene todo el código necesario: pantalla de suscripción (paywall), funciones que hablan con Stripe, y una tabla en Supabase que guarda quién está pagando. Falta la configuración, que se hace desde los paneles de Stripe y Supabase (no requiere tocar código).

### 5.1 Crear el producto en Stripe

1. Entra a https://stripe.com y crea una cuenta (queda en "modo de prueba" por default — perfecto para probar antes de cobrar de verdad).
2. En el menú lateral, ve a **Product catalog** → **Add a product**.
3. Ponle nombre (ej. "FocusFlow TDAH — Suscripción mensual"), precio (ej. $5-9 USD), y marca que sea **Recurring** (recurrente), mensual.
4. Guarda el producto. En la página del producto vas a ver el **Price ID**, algo como `price_1AbCdEfG...` — cópialo.

### 5.2 Conseguir tus claves de Stripe

1. En el menú lateral, ve a **Developers → API keys**.
2. Copia la **Secret key** (empieza con `sk_test_...` en modo de prueba).

### 5.3 Conseguir la Service Role Key de Supabase

1. En tu proyecto de Supabase, ve a **Project Settings → API**.
2. Busca **service_role key** (distinta de la `anon key` que ya usas) y cópiala. **Esta clave nunca debe ir en el código del navegador** — por eso solo la usamos dentro de `api/webhook.js`, que corre en el servidor.

### 5.4 Actualizar la tabla en Supabase

1. Ve a **SQL Editor** en Supabase → pega todo el contenido actualizado de `supabase/schema.sql` (incluye la tabla `subscriptions` nueva) → dale "Run".

### 5.5 Agregar las variables en Vercel

En tu proyecto en Vercel → **Settings → Environment Variables**, agrega estas cuatro (además de las dos que ya tenías):

| Nombre | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | tu Secret key de Stripe |
| `STRIPE_PRICE_ID` | el Price ID que copiaste |
| `SUPABASE_SERVICE_ROLE_KEY` | tu service_role key de Supabase |
| `STRIPE_WEBHOOK_SECRET` | (la agregas en el siguiente paso) |

### 5.6 Conectar el webhook

El webhook es lo que le avisa a tu app cuando alguien pagó de verdad.

1. Primero necesitas que tu proyecto esté publicado en Vercel con los cambios de este paso (sube a GitHub como siempre, espera a que Vercel lo publique).
2. En Stripe, ve a **Developers → Webhooks → Add endpoint**.
3. En "Endpoint URL" pon: `https://TU-DOMINIO.vercel.app/api/webhook` (reemplaza con tu dominio real).
4. En "Events to send" busca y selecciona: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
5. Guarda. Stripe te va a mostrar un **Signing secret** (empieza con `whsec_...`) — cópialo y agrégalo en Vercel como `STRIPE_WEBHOOK_SECRET` (el que dejamos pendiente en el paso anterior).
6. Vuelve a desplegar el proyecto en Vercel (Deployments → los tres puntos del último deployment → "Redeploy") para que tome esta variable nueva.

### 5.7 Probar el pago

Stripe en modo de prueba no cobra dinero real. Usa esta tarjeta de prueba:
- Número: `4242 4242 4242 4242`
- Fecha: cualquier fecha futura
- CVC: cualquier 3 dígitos

Crea una cuenta nueva en tu app, dale "Suscribirme", paga con esa tarjeta de prueba, y confirma que te deja entrar a la app después del pago.

### 5.8 Pasar a cobros reales

Cuando quieras cobrar de verdad: en Stripe, activa tu cuenta completa (piden datos fiscales/bancarios), cambia del modo de prueba al modo real (interruptor arriba en el panel de Stripe), repite los pasos 5.1 y 5.2 en modo real (las claves cambian de `sk_test_`/`price_...test` a las de producción), y actualiza las variables en Vercel con esas nuevas claves.

## 6. Si más adelante quieres subirla a App Store / Google Play

Esta misma base de código se puede empaquetar como app nativa con una herramienta llamada Capacitor, pero ahí el cobro de suscripción tiene que pasar por Apple/Google (con su propia comisión), no por Stripe directo. Vale la pena validar primero con la versión instalable (PWA) antes de dar ese paso — cuando llegue el momento, dime y armamos esa parte.

## Nota sobre lo que se guarda y lo que no

Por ahora se guarda entre sesiones: el XP, el tarro de logros, y los interruptores del rastreador de estilo de vida (sueño, alimentación, movimiento, escritorio). El desglosador de tareas, el cronómetro del auditor de tiempo, y la reestructuración de pensamientos se reinician cada vez que abres la app — son herramientas de uso puntual, no historial que necesite guardarse.

Los interruptores del rastreador tampoco se reinician automáticamente cada día todavía (eso quedaría como una mejora futura, útil para que cada día empiece "en blanco").
