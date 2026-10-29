import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Firma de webhook inválida:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;
      // Fase 1 de suscripciones (29 de octubre de 2026): "plan" ("monthly"
      // | "annual") viaja en los metadatos de la sesión desde
      // api/create-checkout-session.js — se guarda tal cual, sin inventar
      // ningún valor si por algún motivo no llegara.
      const plan = session.metadata?.plan || null;
      if (userId) {
        await supabaseAdmin.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: "active",
          plan,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      // Si la paciente cambia de plan (mensual ↔ anual) desde el portal de
      // Stripe, el ID del precio activo puede cambiar sin pasar de nuevo
      // por checkout.session.completed — por eso aquí también se
      // recalcula "plan" a partir del precio real de la suscripción,
      // comparando contra los dos precios conocidos. Si no coincide con
      // ninguno (por ejemplo una suscripción vieja con el precio anterior
      // de $199/mes), "plan" se deja como estaba, para no borrar un dato
      // que sí se conocía por otro medio.
      const priceId = sub.items?.data?.[0]?.price?.id;
      const planByPrice =
        priceId === process.env.STRIPE_PRICE_ID_MONTHLY
          ? "monthly"
          : priceId === process.env.STRIPE_PRICE_ID_ANNUAL
          ? "annual"
          : undefined;

      const update = { status: sub.status, updated_at: new Date().toISOString() };
      if (planByPrice) update.plan = planByPrice;

      await supabaseAdmin.from("subscriptions").update(update).eq("stripe_subscription_id", sub.id);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error procesando webhook:", err);
    res.status(500).json({ error: err.message });
  }
}
