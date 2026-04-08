import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import twilio from 'npm:twilio@5.3.3';

const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const FROM_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER");
const VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { action, phone, code } = await req.json();
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

    if (action === "send") {
      // Use Twilio Verify service if configured, otherwise send manual SMS
      if (VERIFY_SERVICE_SID) {
        await client.verify.v2.services(VERIFY_SERVICE_SID)
          .verifications.create({ to: phone, channel: "sms" });
      } else {
        // Generate a 6-digit code and store in user data temporarily
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
        await base44.asServiceRole.entities.User.update(user.id, {
          pending_otp: otp,
          pending_otp_expires: expiresAt
        });
        await client.messages.create({
          body: `O seu código KANDU é: ${otp}. Válido por 10 minutos.`,
          from: FROM_NUMBER,
          to: phone
        });
      }
      return Response.json({ sent: true });

    } else if (action === "verify") {
      if (VERIFY_SERVICE_SID) {
        const check = await client.verify.v2.services(VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: phone, code });
        return Response.json({ valid: check.status === "approved" });
      } else {
        // Manual OTP check
        const userData = await base44.asServiceRole.entities.User.get(user.id);
        const now = new Date();
        const valid = userData.pending_otp === code &&
          userData.pending_otp_expires &&
          new Date(userData.pending_otp_expires) > now;
        if (valid) {
          await base44.asServiceRole.entities.User.update(user.id, {
            pending_otp: null,
            pending_otp_expires: null
          });
        }
        return Response.json({ valid: !!valid });
      }
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});