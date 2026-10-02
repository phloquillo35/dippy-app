import type { CashRegister } from '@/types';

/** Ventas cobradas en la caja (efectivo, transferencia, tarjeta y MercadoPago). */
export const getCashSales = (register: CashRegister | null): number =>
  register ? register.cashIn + register.transfersIn + register.cardIn + register.mercadopagoIn : 0;

/** Saldo esperado de la caja: apertura + ventas - egresos (la misma cuenta que usa el cierre de caja). */
export const getCashBalance = (register: CashRegister | null): number =>
  register ? register.openingAmount + getCashSales(register) - register.cashOut : 0;
