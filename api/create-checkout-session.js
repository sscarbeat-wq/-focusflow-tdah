import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Fase 1 de suscripciones (29 de octubre de 2026): antes había un solo
// precio (STRIPE_PRICE_ID, $199 MXN/mes). Ahora el plan Plus tiene dos
// precios (mensual y anual), así que el navegador manda cuál quiere y el
// servidor valida que sea uno de los dos IDs reales configurados en Vercel
// — nunca se confía en un priceId arbitrario mandado desde el cliente.
function allowedPlans() {
  return {
    [process.env.STRIPE_PRICE_ID_MONTHLY]: "monthly",
    [process.env.STRIPE_PRICE_ID_ANNUAL]: "annual",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { userId, email, priceId } = req.body || {};
  if (!userId || !email || !priceId) {
    return res.status(400).json({ error: "Falta userId, email o priceId" });
  }

  const plans = allowedPlans();
  const plan = plans[priceId];
  if (!plan) {
    return res.status(400).json({ error: "priceId no reconocido" });
  }

  try {
    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
      // "plan" viaja también a nivel de sesión (no solo en la suscripción)
      // para que el webhook lo pueda leer directo desde
      // checkout.session.completed sin tener que consultar la suscripción
      // aparte.
      metadata: { supabase_user_id: userId, plan },
      subscription_data: {
        metadata: { supabase_user_id: userId, plan },
        // Fase 1: ya no se ofrece el trial de 7 días con tarjeta que existía
        // antes de este cambio — ahora toda cuenta nueva ya tuvo 14 días de
        // prueba completa SIN tarjeta (ver src/plans.js). Alguien que llega
        // hasta esta pantalla de pago ya decidió suscribirse de verdad, así
        // que no tendría sentido darle otro periodo de prueba encima.
      },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
