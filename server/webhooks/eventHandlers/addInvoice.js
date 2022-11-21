import { addInvoice as addInvoiceModel } from '../../db/models';

export default async function addInvoice(invoice) {
  const {
    id, customer, period_end: chargeDate, total, lines: { data: [{ price: { product }, quantity }] }
  } = invoice;

  if (total > 0) {
    await addInvoiceModel(id, customer, product, quantity, chargeDate, total);
  }
}
