import type { Order, OrderItem } from "../db/schema";

export interface OrderNotificationPayload {
  order: Partial<Order> & {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    shippingAddress: string;
    city: string;
    paymentMethod: string;
    paymentStatus?: string;
    paymentTrxId?: string | null;
    status?: string;
    total: number;
    subtotal?: number;
    shippingCost?: number;
    discount?: number;
    notes?: string | null;
    createdAt?: Date;
  };
  items: Array<{
    productTitle: string;
    productSku?: string | null;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
}

/**
 * Dispatches instant rich HTML notifications to the store owner's Telegram Chat via Bot API
 */
export async function sendTelegramOrderNotification(
  payload: OrderNotificationPayload,
  botToken?: string,
  chatId?: string
): Promise<void> {
  if (!botToken || !chatId) {
    console.warn("[Telegram] Notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing.");
    return;
  }

  const { order, items } = payload;
  const formattedTotal = (order.total / 100).toFixed(2);
  const formattedShipping = ((order.shippingCost ?? 0) / 100).toFixed(2);

  const itemListText = items
    .map(
      (item) =>
        `• <b>${escapeHtml(item.productTitle)}</b> x${item.quantity} - $${(
          item.totalPrice / 100
        ).toFixed(2)}`
    )
    .join("\n");

  const message = [
    `🛍️ <b>NEW ORDER RECEIVED!</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>Order ID:</b> <code>${order.id}</code>`,
    `<b>Status:</b> ${(order.status ?? "pending").toUpperCase()}`,
    `<b>Payment:</b> ${order.paymentMethod.toUpperCase()} (${order.paymentStatus ?? "pending"})`,
    order.paymentTrxId ? `<b>Trx ID:</b> <code>${order.paymentTrxId}</code>` : "",
    ``,
    `👤 <b>Customer Details:</b>`,
    `<b>Name:</b> ${escapeHtml(order.customerName)}`,
    `<b>Phone:</b> <code>${escapeHtml(order.customerPhone)}</code>`,
    order.customerEmail ? `<b>Email:</b> ${escapeHtml(order.customerEmail)}` : "",
    `<b>Address:</b> ${escapeHtml(order.shippingAddress)}, ${escapeHtml(order.city)}`,
    order.notes ? `<b>Notes:</b> <i>${escapeHtml(order.notes)}</i>` : "",
    ``,
    `📦 <b>Order Items:</b>`,
    itemListText,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>Shipping:</b> $${formattedShipping}`,
    `<b>Total:</b> <b>$${formattedTotal}</b>`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Telegram] API error:", res.status, errText);
    }
  } catch (err) {
    console.error("[Telegram] Failed to send notification:", err);
  }
}

/**
 * Dispatches confirmation emails to customer via Resend API
 */
export async function sendResendOrderEmail(
  payload: OrderNotificationPayload,
  resendApiKey?: string,
  fromEmail = "orders@yourstore.com"
): Promise<void> {
  const { order, items } = payload;
  if (!resendApiKey || !order.customerEmail) {
    return;
  }

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(item.productTitle)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.totalPrice / 100).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #111;">
      <h2 style="color: #0f172a; margin-bottom: 8px;">Order Confirmation</h2>
      <p style="color: #64748b; font-size: 14px;">Thank you for your order, ${escapeHtml(order.customerName)}! Your order ID is <strong>${order.id}</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 8px; text-align: left; font-size: 12px; text-transform: uppercase;">Item</th>
            <th style="padding: 8px; text-align: center; font-size: 12px; text-transform: uppercase;">Qty</th>
            <th style="padding: 8px; text-align: right; font-size: 12px; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; border-top: 2px solid #e2e8f0; padding-top: 12px; font-size: 15px;">
        <p style="margin: 4px 0;">Shipping: <strong>$${(((order.shippingCost ?? 0)) / 100).toFixed(2)}</strong></p>
        <p style="margin: 4px 0; font-size: 18px; color: #0f172a;">Total: <strong>$${(order.total / 100).toFixed(2)}</strong></p>
      </div>

      <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: #475569;">
        <p style="margin: 0 0 6px 0;"><strong>Shipping To:</strong> ${escapeHtml(order.shippingAddress)}, ${escapeHtml(order.city)}</p>
        <p style="margin: 0;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: order.customerEmail,
        subject: `Order Confirmed #${order.id}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Resend] API error:", res.status, errText);
    }
  } catch (err) {
    console.error("[Resend] Failed to send email:", err);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
