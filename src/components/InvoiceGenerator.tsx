import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FileText, CreditCard, DollarSign, Calendar } from "lucide-react";

// Actualizar la interfaz Payment
interface Payment {
  id: number;
  amount: number;
  createdAt: string;
  purchaseId: number;
  purchase?: Purchase; // Opcional ya que no lo necesitamos para mostrar
}

interface Product {
  id: number;
  name: string;
  purchaseId: number;
  quantity: number;
  price: number;
  createdAt: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

interface Purchase {
  id: number;
  price: number;
  customerId: number;
  status: string;
  orderdate: Date;
  payday: Date;
  debt: number;
  createdAt: string;
  name: string;
  products: Product[];
  customer: Customer;
  payments?: Payment[]; // Abonos realizados
}

interface InvoiceGeneratorProps {
  purchase: Purchase;
}

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Función para obtener el icono del método de pago
const getPaymentMethodIcon = (method?: string) => {
  switch (method?.toLowerCase()) {
    case 'efectivo':
      return <DollarSign size={16} className="text-green-600" />;
    case 'tarjeta':
      return <CreditCard size={16} className="text-blue-600" />;
    default:
      return <DollarSign size={16} className="text-gray-600" />;
  }
};

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ purchase }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const generateInvoicePDF = async () => {
    if (!invoiceRef.current) return;

    // Cambiar temporalmente el estilo para la captura
    const originalDisplay = invoiceRef.current.style.display;
    invoiceRef.current.style.display = "block";
    
    try {
      // Configuración optimizada para PDF con tipos adecuados
      const pdfOptions = {
        orientation: 'portrait' as const,
        unit: 'mm' as const,
        format: 'a4',
        compress: true
      };
      
      const pdf = new jsPDF(pdfOptions);
      
      // Ajustar el tamaño del contenido antes de la captura
      const originalWidth = invoiceRef.current.style.width;
      // Fijar ancho exacto para A4 (aproximadamente 210mm)
      invoiceRef.current.style.width = "210mm";
      invoiceRef.current.style.maxWidth = "210mm";
      
      // Configuración optimizada para html2canvas
      const canvasOptions = {
        scale: 2, // Mayor calidad para captura
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        // Importante: evitar scroll para captura completa
        windowWidth: invoiceRef.current.scrollWidth,
        windowHeight: invoiceRef.current.scrollHeight
      };
      
      const canvas = await html2canvas(invoiceRef.current, canvasOptions);
      
      // Usar calidad de imagen balanceada
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      
      // Dimensiones A4 en mm
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10; // Márgenes razonables
      
      // Calcular dimensiones manteniendo proporción
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Agregar imagen al PDF con posicionamiento centrado
      pdf.addImage(
        imgData,
        "JPEG",
        margin,
        margin,
        imgWidth,
        Math.min(imgHeight, pageHeight - (margin * 2)), // No exceder la altura de página
        undefined,
        'MEDIUM' // Calidad media para mejor balance
      );

      // Si el contenido es muy largo, ajustar para multi-página
      if (imgHeight > pageHeight - (margin * 2)) {
        // Agregar aviso de contenido continuado
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Ver página siguiente para contenido adicional', pageWidth / 2, pageHeight - 5, { align: "center" });
        
        // Agregar segunda página para el resto del contenido
        pdf.addPage();
        
        // Calcular la parte visible en primera página
        const firstPageHeight = pageHeight - (margin * 2);
        const remainingHeight = imgHeight - firstPageHeight;
        
        // Posicionar la segunda parte de la imagen
        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          margin - firstPageHeight,
          imgWidth,
          imgHeight,
          undefined,
          'MEDIUM'
        );
      }
      
      // Propiedades del PDF
      pdf.setProperties({
        title: `Factura ${purchase.name}`,
        subject: `Factura No. ${purchase.id}`,
        creator: 'Sistema de Facturación'
      });
      
      pdf.save(`Factura_${purchase.name}_${purchase.id}.pdf`);
      
      // Restaurar estilo original
      invoiceRef.current.style.width = originalWidth;
    } catch (error) {
      console.error("Error generando PDF:", error);
    } finally {
      // Restaurar el estilo original
      invoiceRef.current.style.display = originalDisplay;
    }
  };

  // Calcular subtotal y totales
  const subtotal = purchase.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const total = purchase.price; // O usar subtotal + iva si prefieres calcularlo
  
  // Calcular total abonado
  const totalPaid = purchase.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  return (
    <div>
      <button
        onClick={generateInvoicePDF}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                  bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors
                  w-full sm:w-auto"
      >
        <FileText size={16} className="shrink-0" />
        <span className="text-xs sm:text-sm font-medium truncate">Descargar Factura</span>
      </button>

      {/* Hidden Invoice Template */}
      <div 
        ref={invoiceRef} 
        style={{ 
          display: "none",
          width: "210mm", // Ancho fijo para A4
          maxWidth: "210mm",
          margin: "0 auto", // Centrar
          boxSizing: "border-box" // Asegurar que padding está incluido en ancho
        }} 
        className="bg-white p-8 font-sans"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">FACTURA</h1>
            <p className="text-gray-500 mt-1">N° {purchase.id.toString().padStart(6, '0')}</p>
          </div>
          <div className="text-right">
            <div className="bg-blue-600 text-white py-1 px-3 rounded-md text-sm font-medium inline-block mb-2">
              {purchase.status === "pagado" ? "PAGADO" : "PENDIENTE"}
            </div>
            <p className="text-sm text-gray-600">Fecha de emisión: {formatDate(purchase.orderdate)}</p>
            <p className="text-sm text-gray-600">Fecha de vencimiento: {formatDate(purchase.payday)}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="flex flex-wrap md:flex-nowrap justify-between mt-8 gap-8">
          <div className="w-full md:w-1/2">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">DE:</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-800">Camisas Elegantes S.L.</p>
              <p className="text-gray-600 mt-1">Calle Mayor 123</p>
              <p className="text-gray-600">28001 Madrid, España</p>
              <p className="text-gray-600 mt-1">NIT: 901.234.567-8</p>
              <p className="text-gray-600">Tel: +34 91 123 45 67</p>
              <p className="text-gray-600">info@camisaselegantes.com</p>
            </div>
          </div>
          
          <div className="w-full md:w-1/2">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">FACTURAR A:</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-800">{purchase.customer.name}</p>
              <p className="text-gray-600 mt-1">Teléfono: {purchase.customer.phone}</p>
              <p className="text-gray-600">Cliente desde: {formatDate(purchase.customer.createdAt)}</p>
              <p className="text-gray-600 mt-1">Compra: {purchase.name}</p>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">DETALLES DE LA COMPRA</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="py-3 px-4 text-gray-600 font-semibold">CANT.</th>
                  <th className="py-3 px-4 text-gray-600 font-semibold">DESCRIPCIÓN</th>
                  <th className="py-3 px-4 text-gray-600 font-semibold text-right">PRECIO UNIT.</th>
                  <th className="py-3 px-4 text-gray-600 font-semibold text-right">IMPORTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchase.products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{product.quantity}</td>
                    <td className="py-3 px-4 text-gray-800">{product.name}</td>
                    <td className="py-3 px-4 text-gray-800 text-right">{formatCurrency(product.price)}</td>
                    <td className="py-3 px-4 text-gray-800 text-right">{formatCurrency(product.price * product.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary with Payment Details */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-80 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total Factura:</span>
              <span className="text-gray-800">{formatCurrency(total)}</span>
            </div>
            
            {/* Payment Details */}
            {purchase.payments && purchase.payments.length > 0 && (
              <div className="border-t border-gray-200 pt-2 mb-2">
                <p className="text-sm text-gray-600 mb-1">Abonos realizados:</p>
                {purchase.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between text-sm pl-2 py-1">
                    <span className="text-gray-600">
                      {formatDate(payment.createdAt)}:
                    </span>
                    <span className="text-green-600">-{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-100">
                  <span className="text-gray-700">Total Abonado:</span>
                  <span className="text-green-600">-{formatCurrency(totalPaid)}</span>
                </div>
              </div>
            )}
            
            {/* Final Balance */}
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
              <span className="text-gray-800">SALDO PENDIENTE:</span>
              <span className={purchase.debt <= 0 ? "text-green-600" : "text-red-600"}>
                {formatCurrency(purchase.debt)}
              </span>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              {purchase.debt <= 0 
                ? "✓ Esta factura ha sido pagada en su totalidad." 
                : `⚠️ Pendiente por pagar: ${formatCurrency(purchase.debt)}`}
            </div>
          </div>
        </div>

        {/* Abonos / Historial de Pagos */}
        

        {/* Abonos / Historial de Pagos - Versión Detallada */}
     

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            Gracias por su compra. Para cualquier consulta relacionada con esta factura, 
            por favor contacte con nuestro servicio de atención al cliente.
          </p>
          <p className="text-center text-gray-500 text-sm mt-1">
            © {new Date().getFullYear()} Camisas Elegantes S.L. - Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;