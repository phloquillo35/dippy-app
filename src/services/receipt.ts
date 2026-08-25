import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CartItem, PaymentMethod } from '@/types';

export interface ReceiptData {
  businessName: string;
  businessSubtitle: string;
  orderId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee?: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  notes?: string;
  cashierName: string;
  date: string;
  accentColor: string;
}

export async function generateReceipt(data: ReceiptData): Promise<void> {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td>${item.quantity}x</td>
      <td>${item.productName}</td>
      <td style="text-align:right">$${item.unitPrice.toLocaleString()}</td>
      <td style="text-align:right;font-weight:bold">$${item.totalPrice.toLocaleString()}</td>
    </tr>
  `).join('');

  const paymentLabels: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    mercadopago: 'MercadoPago',
    qr: 'QR',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 12px; }
        .business-name { font-size: 24px; font-weight: bold; }
        .business-sub { font-size: 12px; color: #666; }
        .title { font-size: 14px; text-align: center; margin: 12px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { border-bottom: 1px solid #333; text-align: left; padding: 4px 0; font-size: 11px; color: #666; }
        td { padding: 4px 0; }
        .totals { border-top: 2px dashed #333; padding-top: 8px; margin-top: 8px; }
        .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px; }
        .total-final { font-size: 18px; font-weight: bold; border-top: 1px solid #333; padding-top: 4px; margin-top: 4px; }
        .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 2px dashed #333; font-size: 11px; color: #666; }
        .accent { color: ${data.accentColor}; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name accent">${data.businessName}</div>
        <div class="business-sub">${data.businessSubtitle}</div>
      </div>

      <div class="title">TICKET DE VENTA</div>
      <div style="font-size:12px;text-align:center;margin-bottom:8px">
        #${data.orderId.slice(-6).toUpperCase()} · ${new Date(data.date).toLocaleString('es-AR')}
      </div>

      ${data.customerName ? `<div style="font-size:12px;margin-bottom:4px"><b>Cliente:</b> ${data.customerName}</div>` : ''}
      ${data.customerAddress ? `<div style="font-size:12px;margin-bottom:4px"><b>Dirección:</b> ${data.customerAddress}</div>` : ''}

      <table>
        <thead>
          <tr><th>Cant</th><th>Producto</th><th style="text-align:right">P.U.</th><th style="text-align:right">Total</th></tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>$${data.subtotal.toLocaleString()}</span></div>
        ${data.discount > 0 ? `<div class="total-row" style="color:green"><span>Descuento</span><span>-$${data.discount.toLocaleString()}</span></div>` : ''}
        ${data.deliveryFee ? `<div class="total-row"><span>Envío</span><span>$${data.deliveryFee.toLocaleString()}</span></div>` : ''}
        <div class="total-row total-final"><span>TOTAL</span><span class="accent">$${data.total.toLocaleString()}</span></div>
      </div>

      <div class="totals" style="margin-top:12px">
        <div class="total-row"><span>Método de pago:</span><span>${paymentLabels[data.paymentMethod] || data.paymentMethod}</span></div>
      </div>

      ${data.notes ? `<div style="font-size:12px;margin-top:8px"><b>Notas:</b> ${data.notes}</div>` : ''}

      <div class="footer">
        <div>Atendido por: ${data.cashierName}</div>
        <div style="margin-top:4px">¡Gracias por su compra! 🇦🇷</div>
      </div>
    </body>
    </html>
  `;

  await Print.printAsync({ html });
}

export async function generateReportHtml(title: string, content: string, accentColor: string): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { color: ${accentColor}; border-bottom: 2px solid ${accentColor}; padding-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #f0f0f0; padding: 8px; text-align: left; font-size: 13px; }
      td { padding: 8px; border-bottom: 1px solid #eee; font-size: 13px; }
      .total { font-weight: bold; font-size: 16px; color: ${accentColor}; }
    </style></head>
    <body><h1>${title}</h1>${content}</body>
    </html>
  `;
  return html;
}
