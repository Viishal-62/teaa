import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// ── Rate Limiting (in-memory, per IP) ──────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3; // max emails per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  if (entry.count >= RATE_LIMIT) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

// ── POST Handler ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, _honeypot, _loadedAt } = body;

    // 🍯 Layer 1: Honeypot check — bots fill hidden fields
    if (_honeypot) {
      // Pretend success so bots don't retry
      return NextResponse.json({ success: true });
    }

    // ⏱️ Layer 2: Time check — reject if submitted < 3s after load
    const elapsed = Date.now() - (_loadedAt || 0);
    if (elapsed < 3000) {
      return NextResponse.json(
        { error: "Please take your time filling out the form." },
        { status: 429 },
      );
    }

    // 🚦 Layer 3: Rate limiting by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 },
      );
    }

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // ── Nodemailer Transport ─────────────────────────────────────
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD, // Gmail App Password
      },
    });

    const mailSubject = subject
      ? `[Teaa Contact] ${subject}: ${name}`
      : `[Teaa Contact] New message from ${name}`;

    // ── Send Email ───────────────────────────────────────────────
    await transporter.sendMail({
      from: `"Teaa Contact Form" <${process.env.SMTP_EMAIL}>`,
      to: process.env.SMTP_EMAIL, // Send to yourself
      replyTo: email, // Reply goes to the visitor
      subject: mailSubject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden;">
          <div style="background: #1a1a1a; padding: 28px 32px;">
            <h1 style="margin: 0; font-size: 20px; color: #ffffff; font-weight: 700;">
              ☕ New Contact Message
            </h1>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e8e4df; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; width: 100px;">Name</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e8e4df; font-size: 15px; color: #1a1a1a; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e8e4df; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Email</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e8e4df; font-size: 15px; color: #1a1a1a;">
                  <a href="mailto:${email}" style="color: #4a6cf7; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e8e4df; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Subject</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e8e4df; font-size: 15px; color: #1a1a1a;">${subject || "General"}</td>
              </tr>
            </table>
            <div style="background: #ffffff; border: 1px solid #e8e4df; border-radius: 12px; padding: 20px;">
              <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999;">Message</p>
              <p style="margin: 0; font-size: 15px; color: #1a1a1a; line-height: 1.7; white-space: pre-wrap;">${message}</p>
            </div>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8e4df;">
              <p style="margin: 0; font-size: 11px; color: #bbb;">
                Sent from teaadrop.xyz contact form • Reply directly to respond to ${name}
              </p>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 },
    );
  }
}
