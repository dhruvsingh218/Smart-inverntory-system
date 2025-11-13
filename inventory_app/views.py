from rest_framework import generics # type: ignore
from rest_framework.views import APIView# type: ignore
from rest_framework.response import Response# type: ignore
from rest_framework.permissions import IsAuthenticated# type: ignore
from rest_framework_simplejwt.authentication import JWTAuthentication# type: ignore
from django.shortcuts import get_object_or_404# type: ignore
from django.http import HttpResponse# type: ignore

# --- ReportLab Imports ---
from reportlab.pdfgen import canvas# type: ignore
from reportlab.lib.units import inch# type: ignore
from reportlab.lib import colors# type: ignore
from reportlab.lib.enums import TA_CENTER, TA_RIGHT# type: ignore

# --- Django DB Imports ---
from django.db.models import Sum, F, DecimalField # type: ignore
from django.db.models.functions import Coalesce# type: ignore
from .models import Product, Invoice, InvoiceItem# type: ignore
from .serializers import ProductSerializer, InvoiceSerializer# type: ignore
from datetime import timedelta# type: ignore
from django.db.models.functions import TruncDate# type: ignore
from django.utils import timezone# type: ignore

# --- Product Listing/Detail Views ---

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductDetailByCodeView(APIView):
    def get(self, request, code, format=None):
        product = get_object_or_404(Product, code=code)
        serializer = ProductSerializer(product)
        return Response(serializer.data)
    
# --- Purchase View (SECURE) ---

class PurchaseCreateView(generics.CreateAPIView):
    queryset = Invoice.objects.all() 
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    # FIX: Authentication classes ko hata dein, taki Billing cards load ho saken
    # authentication_classes = [JWTAuthentication] 
    # permission_classes = [IsAuthenticated]      
    # NOTE: Purchase/Analytics APIs abhi bhi secure rahenge.

# --- Bill Generation View (UNSECURE FOR BROWSER ACCESS) ---

class BillGenerateView(APIView):
    # FIX: Authentication ko hata diya, taki bill browser mein khul sake
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request, invoice_id): 
        
        try:
            invoice = Invoice.objects.get(id=invoice_id) 
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found"}, status=404)

        # 2. Setup Document & Response Headers
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.id}.pdf"'
        
        p = canvas.Canvas(response)

        # --- Shop Constants (Final Bill Data) ---
        SHOP_NAME = "Smart Shop - Retail Bill"
        SHOP_ADDRESS = "123, Central Market, New Delhi - 110001"
        SHOP_CONTACT = "Contact: 011-23456789"
        SHOP_GSTIN = "GSTIN: 07AAACB1234A1Z0"
        CUSTOMER_NAME = "Cash Customer" 
        PAYMENT_METHOD = "PAID (CASH)"

        # --- COORDINATE CONSTANTS (Final Alignment) ---
        X_LEFT = 1.0 * inch
        X_RIGHT = 7.4 * inch
        X_PRICE_POS = 5.4 * inch 
        X_QTY_POS = 6.0 * inch   
        X_TOTAL_POS = 7.4 * inch 
        
        # --- BILL HEADER ---
        p.setFont("Helvetica-Bold", 16)
        p.drawCentredString(4.25 * inch, 10.5 * inch, SHOP_NAME)
        
        p.setFont("Helvetica", 10)
        p.drawCentredString(4.25 * inch, 10.3 * inch, SHOP_ADDRESS)
        p.drawCentredString(4.25 * inch, 10.15 * inch, SHOP_CONTACT)
        p.drawCentredString(4.25 * inch, 10.0 * inch, SHOP_GSTIN)
        
        p.line(X_LEFT, 9.8 * inch, X_RIGHT, 9.8 * inch)
        
        # --- INVOICE & CUSTOMER DETAILS ---
        p.drawString(X_LEFT, 9.6 * inch, f"Invoice ID: {invoice.id}")
        p.drawString(X_LEFT, 9.4 * inch, f"Customer: {CUSTOMER_NAME}")
        
        p.drawString(5.5 * inch, 9.6 * inch, f"Date: {invoice.invoice_date.strftime('%Y-%m-%d %H:%M')}")
        p.drawString(5.5 * inch, 9.4 * inch, f"Payment: {PAYMENT_METHOD}")

        p.line(X_LEFT, 9.3 * inch, X_RIGHT, 9.3 * inch)

        # --- ITEMS TABLE HEADER ---
        y_position = 9.1 * inch
        p.setFont("Helvetica-Bold", 10)
        p.drawString(X_LEFT, y_position, "Product Name")
        
        p.drawRightString(X_PRICE_POS, y_position, "Price") 
        p.drawRightString(X_QTY_POS, y_position, "Qty")
        p.drawRightString(X_TOTAL_POS, y_position, "Total")
        p.line(X_LEFT, 9.0 * inch, X_RIGHT, 9.0 * inch) 
        
        # --- ITEMS LIST ---
        p.setFont("Helvetica", 10)
        y_position -= 0.2 * inch
        total_items = invoice.items.all() 

        for item in total_items:
            item_total = item.unit_price_at_sale * item.quantity_sold
            
            p.drawString(X_LEFT, y_position, item.product.name) 
            
            # Values ko Headers ke niche Right Align karna (perfect alignment)
            p.drawRightString(X_PRICE_POS, y_position, f"{item.unit_price_at_sale:.2f}") 
            p.drawRightString(X_QTY_POS, y_position, f"{item.quantity_sold}")
            p.drawRightString(X_TOTAL_POS, y_position, f"{item_total:.2f}") 
            
            y_position -= 0.2 * inch

        # --- TOTALS SUMMARY ---
        
        y_position -= 0.1 * inch
        p.line(5.5 * inch, y_position, X_RIGHT, y_position) 
        
        # Sub Total
        y_position -= 0.2 * inch
        p.drawString(5.5 * inch, y_position, "Sub Total:")
        p.drawRightString(X_TOTAL_POS, y_position, f"{invoice.sub_total:.2f}")
        
        # GST
        y_position -= 0.2 * inch
        p.drawString(5.5 * inch, y_position, "GST (5%):")
        p.drawRightString(X_TOTAL_POS, y_position, f"{invoice.gst_amount:.2f}")
        
        # GRAND TOTAL
        y_position -= 0.3 * inch
        p.setFont("Helvetica-Bold", 12)
        p.setFillColor(colors.red)
        p.drawString(5.5 * inch, y_position, "GRAND TOTAL:")
        p.drawRightString(X_TOTAL_POS, y_position, f"₹{invoice.grand_total:.2f}")
        
        p.setFillColor(colors.black) 
        
        # --- THANK YOU MESSAGE ---
        y_position -= 0.5 * inch
        p.setFont("Helvetica-Bold", 10)
        p.drawCentredString(4.25 * inch, y_position, "*** Thank You for Shopping! Please Visit Again ***")

        p.showPage()
        p.save()
        return response


# --- 4. Analytics View (Profit/Revenue) ---

class AnalyticsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        revenue_data = Invoice.objects.aggregate(
            total_revenue=Sum('sub_total', output_field=DecimalField()),
            total_gst=Sum('gst_amount', output_field=DecimalField()),
            total_grand_total=Sum('grand_total', output_field=DecimalField())
        )
        
        # FIX 1: Profit Calculation output_field
        profit_data_raw = InvoiceItem.objects.annotate(
            item_profit = F('quantity_sold') * (F('unit_price_at_sale') - F('product__cost_price'))
        ).aggregate(
            total_profit=Sum('item_profit', output_field=DecimalField())
        )
        
        low_stock_products = Product.objects.filter(current_stock__lte=10).values('name', 'current_stock')

        # FIX 2: Top Selling Calculation output_field
        top_products = InvoiceItem.objects.values('product__name', 'product__code').annotate(
            total_quantity_sold=Coalesce(Sum('quantity_sold'), 0), 
            total_revenue=Coalesce(
                Sum(F('quantity_sold') * F('unit_price_at_sale')), 
                0, 
                output_field=DecimalField()
            ) 
        ).order_by('-total_quantity_sold')[:5]

        # FIX 3: Ensure top_selling is part of the returned dictionary
        analytics = {
            'revenue': {
                'total_revenue': revenue_data['total_revenue'] or 0,
                'total_profit': profit_data_raw['total_profit'] or 0,
                'total_gst_collected': revenue_data['total_gst'] or 0,
            },
            'stock': {
                'total_products': Product.objects.count(),
                'low_stock_alerts': list(low_stock_products)
            },
            'top_selling': list(top_products)
        }

        return Response(analytics)
    
class RecentSalesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        recent_invoices = Invoice.objects.all().order_by('-invoice_date')[:10] 
        
        data = []
        for invoice in recent_invoices:
            total_items = invoice.items.all()
            item_count = sum(item.quantity_sold for item in total_items)
            
            data.append({
                'id': invoice.id,
                'date': invoice.invoice_date.strftime('%Y-%m-%d %H:%M'),
                'total': invoice.grand_total,
                'items_count': item_count,
                'customer': "Cash Customer" 
            })
            
        return Response(data)
    
    
    # inventory_app/views.py

# ... (Top Imports: JWTAuthentication, IsAuthenticated imported hone chahiye) ...

class DailyRevenueView(APIView):
    # FIX 1: Authentication classes add karein
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        start_date = timezone.now() - timedelta(days=30) # 30 days ka data

        # FIX 2: Ensure all calculations have output_field=DecimalField()
        daily_revenue = Invoice.objects.filter(
            invoice_date__gte=start_date
        ).annotate(
            date=TruncDate('invoice_date')
        ).values('date').annotate(
            daily_revenue=Sum('sub_total', output_field=DecimalField()) # <-- Output field FIX
        ).order_by('date')
        
        # Format data for Chart.js
        formatted_data = [
            {
                'date': item['date'].strftime('%Y-%m-%d'), 
                'revenue': float(item['daily_revenue'])
            } for item in daily_revenue
        ]
        
        return Response(formatted_data)