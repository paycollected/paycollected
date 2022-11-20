import { addInvoice as addInvoiceModel } from '../../db/models';

export default async function addInvoice(invoice) {
  const {
    id,
    customer,
    period_end: chargeDate,
    lines: { data: [{ price: { product }, quantity }] },
    total
  } = invoice;

  if (total > 0) {
    await addInvoiceModel(id, customer, product, quantity, chargeDate, total);
  }
}
