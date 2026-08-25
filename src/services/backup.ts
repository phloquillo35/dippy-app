import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useProductStore } from '@/store/productStore';
import { useOrderStore } from '@/store/orderStore';
import { useCashStore } from '@/store/cashStore';
import { useUserStore } from '@/store/userStore';
import { useCustomerStore } from '@/store/customerStore';
import { useCouponStore } from '@/store/couponStore';
import { useAuditStore } from '@/store/auditStore';
import { useReturnStore } from '@/store/returnStore';
import { useProviderStore } from '@/store/providerStore';

export interface BackupData {
  version: string;
  exportedAt: string;
  stores: {
    products: any[];
    orders: any[];
    registers: any[];
    users: any[];
    customers: any[];
    coupons: any[];
    audit: any[];
    returns: any[];
    providers: any[];
  };
}

export async function exportFullBackup(): Promise<void> {
  const data: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    stores: {
      products: useProductStore.getState().getProducts(),
      orders: useOrderStore.getState().getAllOrders(),
      registers: useCashStore.getState().registers,
      users: useUserStore.getState().users,
      customers: useCustomerStore.getState().customers,
      coupons: useCouponStore.getState().coupons,
      audit: useAuditStore.getState().entries.slice(0, 500),
      returns: useReturnStore.getState().returns,
      providers: useProviderStore.getState().providers,
    },
  };

  const json = JSON.stringify(data, null, 2);
  const fileName = `dippy-backup-${new Date().toISOString().split('T')[0]}.json`;
  const fileUri = (FileSystem as any).documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      UTI: 'public.json',
      mimeType: 'application/json',
    });
  }
}

export async function exportCsvReport(type: 'products' | 'orders' | 'sales'): Promise<void> {
  let csv = '';
  let fileName = '';

  if (type === 'products') {
    const products = useProductStore.getState().getProducts();
    csv = 'Nombre,Categoría,Precio Venta,Precio Costo,Stock,Margen%\n';
    products.forEach(p => {
      const margin = p.costPrice > 0 ? ((p.salePrice - p.costPrice) / p.costPrice * 100).toFixed(1) : 'N/A';
      csv += `"${p.name}","${p.category}",${p.salePrice},${p.costPrice},${p.stock},${margin}%\n`;
    });
    fileName = 'dippy-productos.csv';
  } else if (type === 'orders') {
    const orders = useOrderStore.getState().getAllOrders();
    csv = 'ID,Fecha,Canal,Cliente,Total,Método Pago,Estado\n';
    orders.forEach(o => {
      csv += `"#${o.id.slice(-6)}","${o.createdAt}","${o.channel}","${o.customerName || ''}",${o.total},"${o.paymentMethod}","${o.status}"\n`;
    });
    fileName = 'dippy-pedidos.csv';
  } else if (type === 'sales') {
    const registers = useCashStore.getState().registers;
    csv = 'Negocio,Fecha,Ingresos,Egresos,Estado\n';
    registers.forEach(r => {
      const income = r.cashIn + r.transfersIn + r.cardIn + r.mercadopagoIn;
      csv += `"${r.businessId}","${r.date}",${income},${r.cashOut},"${r.status}"\n`;
    });
    fileName = 'dippy-ventas.csv';
  }

  const fileUri = (FileSystem as any).documentDirectory + fileName;
  await FileSystem.writeAsStringAsync(fileUri, csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      UTI: 'public.comma-separated-values-text',
      mimeType: 'text/csv',
    });
  }
}
