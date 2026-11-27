import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "./_auth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Parche de seguridad (27 de noviembre de 2026): antes este endpoint
  // abría el portal de facturación de CUALQUIER `customerId` de Stripe que
  // mandara el navegador, sin comprobar de quién era — con el número de
  // cliente de otra persona se podía ver su facturación o cancelarle la
  // suscripción. Ahora el `customerId` del cuerpo se ignora: se verifica
  // la sesión (ver api/_auth.js) y el número de cliente se busca en la
  // tabla `subscriptions` de ESA persona, del lado del servidor.
  const authUser = await requireUser(req, res);
  if (!authUser) return;

  try {
    const { data: row, error: readErr } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", authUser.id)
      .maybeSingle();
    if (readErr) throw readErr;

    const customerId = row?.stripe_customer_id;
    if (!customerId) {
      return res.status(400).json({ error: "No encontramos una suscripción para esta cuenta." });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: origin,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
