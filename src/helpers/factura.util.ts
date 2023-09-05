import { IDetalleFactura, ITotales } from "../interfaces/facturas.interface";

//esto solo puede funcionar si el aumento solo corresponde a la matricula extraordinaria
export const calcularTotales = (detalle: IDetalleFactura[]): ITotales => {
  const totalExtraordinario = detalle
    .map(({ valor_unidad, cantidad, aumento, descuento }) => {
      const subtotal = valor_unidad * cantidad;
      //primero se aplica el aumento, para calcular el descuento sobre el resultado obtenido
      const subtotalDescuento = subtotal * descuento;
      const subtotalAumento = subtotal * aumento;
      return subtotal - subtotalDescuento + subtotalAumento;
    })
    .reduce((a, b) => a + b, 0);

  const totalOrdinario = detalle
    .map(({ valor_unidad, cantidad, aumento, descuento }) => {
      const subtotal = valor_unidad * cantidad;
      return subtotal - subtotal * descuento;
    })
    .reduce((a, b) => a + b, 0);

  return {
    totalExtraordinario,
    totalOrdinario,
  };
};

export const calcularSubTotal = (detInvoice: IDetalleFactura): number => {
  const { valor_unidad, cantidad, aumento, descuento } = detInvoice;
  const subtotal = valor_unidad * cantidad;
  //primero se aplica el descueto
  const subtotalDescuento = subtotal * descuento;
  const subtotalAumento = subtotal * aumento;
  return subtotal - subtotalDescuento + subtotalAumento;
};
