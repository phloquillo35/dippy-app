import { CartItem } from '@/types';
import { generateId } from '@/utils/uuid';
import { useProductStore } from '@/store/productStore';
import { BusinessType } from '@/types';

export interface ParsedOrder {
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  notes: string;
  rawMessage: string;
  confidence: number; // 0-1, qué tan seguro está del parseo
}

const GREETINGS = ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'hey'];
const CANCEL_WORDS = ['cancelar', 'cancelo', 'no quiero', 'borrar', 'eliminar', 'chau'];
const QUANTITY_PATTERNS = [
  /^(\d+)\s*x\s*(.+)/i,           // 2x milanesa
  /^(\d+)\s+(.+)/i,               // 2 milanesas
  /^(\d+u)\s*(.+)/i,              // 2u milanesa
  /^(un|una|uno|1)\s+(.+)/i,      // una milanesa
  /^(half|media)\s+(.+)/i,        // media docena
  /^(docena|x12|12u)\s*(.+)/i,    // docena de empanadas
];

function cleanProductSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áà]/g, 'a')
    .replace(/[éè]/g, 'e')
    .replace(/[íì]/g, 'i')
    .replace(/[óò]/g, 'o')
    .replace(/[úù]/g, 'u')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function findProduct(query: string, businessId: BusinessType) {
  const products = useProductStore.getState().getProducts(businessId);
  const clean = cleanProductSearch(query);

  // Exact match by name
  const exact = products.find(p => cleanProductSearch(p.name) === clean);
  if (exact) return exact;

  // Match by tags
  const byTag = products.find(p => p.tags.some(t => cleanProductSearch(t).includes(clean)));
  if (byTag) return byTag;

  // Partial match
  const partial = products.find(p => cleanProductSearch(p.name).includes(clean));
  if (partial) return partial;

  // Fuzzy - split words and check
  const words = clean.split(/\s+/);
  const fuzzy = products.find(p => {
    const nameWords = cleanProductSearch(p.name).split(/\s+/);
    return words.every(w => nameWords.some(nw => nw.includes(w)));
  });

  return fuzzy || null;
}

function parseLine(line: string, businessId: BusinessType): CartItem | null {
  const cleaned = line
    .replace(/^[•\-*]\s*/, '')
    .replace(/^>?\s*/, '')
    .trim();

  if (!cleaned || cleaned.length < 2) return null;

  for (const pattern of QUANTITY_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      let qty = 1;
      const qtyStr = match[1].toLowerCase();

      if (qtyStr === 'un' || qtyStr === 'una' || qtyStr === 'uno') {
        qty = 1;
      } else if (qtyStr === 'half' || qtyStr === 'media') {
        qty = 0.5;
      } else if (qtyStr === 'docena' || qtyStr === 'x12' || qtyStr === '12u') {
        qty = 12;
      } else {
        qty = parseInt(qtyStr) || 1;
      }

      const product = findProduct(match[2], businessId);
      if (product) {
        return {
          id: generateId(),
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice: product.salePrice,
          costPrice: product.costPrice,
          totalPrice: product.salePrice * qty,
          emoji: product.emoji,
        };
      }
    }
  }

  // Try full line as product name
  const product = findProduct(cleaned, businessId);
  if (product) {
    return {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.salePrice,
      costPrice: product.costPrice,
      totalPrice: product.salePrice,
      emoji: product.emoji,
    };
  }

  return null;
}

export function parseWhatsAppMessage(
  message: string,
  businessId: BusinessType = 'delivery'
): ParsedOrder {
  const lines = message.split('\n').filter(l => l.trim());
  const items: CartItem[] = [];
  let notes: string[] = [];
  let confidence = 0;

  // Detect phone from first lines (common WhatsApp patterns)
  let customerName = 'Cliente WhatsApp';
  let customerPhone = '';

  for (const line of lines) {
    const phoneMatch = line.match(/(\+?\d{10,13})/);
    if (phoneMatch && !customerPhone) {
      customerPhone = phoneMatch[1];
      continue;
    }

    // Detect name patterns
    const nameMatch = line.match(/^(?:soy|me llamo|nombre|alias|mi nombre es?)\s+(.+)/i);
    if (nameMatch) {
      customerName = nameMatch[1].trim();
      continue;
    }

    // Skip greetings
    if (GREETINGS.some(g => cleanProductSearch(line).startsWith(g))) continue;

    // Skip cancel words
    if (CANCEL_WORDS.some(c => cleanProductSearch(line).includes(c))) continue;

    // Skip lines that look like phone/address but not products
    if (/^(?:direcci[oó]n|domicilio|entrega|env[ií]o|delivery|horario)/i.test(cleanProductSearch(line))) {
      notes.push(line.trim());
      continue;
    }

    const item = parseLine(line, businessId);
    if (item) {
      items.push(item);
      confidence += 0.2;
    } else if (line.trim().length > 3) {
      notes.push(line.trim());
    }
  }

  // Normalize confidence
  confidence = Math.min(1, confidence / Math.max(1, items.length));

  return {
    customerName,
    customerPhone,
    items,
    notes: notes.join(' | '),
    rawMessage: message,
    confidence,
  };
}

export function formatOrderPreview(parsed: ParsedOrder): string {
  if (parsed.items.length === 0) {
    return 'No se detectaron productos. Intentá enviar algo como:\n\n2x milanesa\n1x coca cola\n';
  }

  const total = parsed.items.reduce((sum, i) => sum + i.totalPrice, 0);
  const itemsList = parsed.items.map(i => `${i.quantity}x ${i.productName} - $${i.totalPrice.toLocaleString()}`).join('\n');

  return `👤 ${parsed.customerName}${parsed.customerPhone ? ` (${parsed.customerPhone})` : ''}\n\n${itemsList}\n\n💰 Total: $${total.toLocaleString()}${parsed.notes ? `\n📝 ${parsed.notes}` : ''}`;
}
