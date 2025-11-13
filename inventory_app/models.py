# inventory_app/models.py
from django.db import models  # type: ignore

class Product(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True) 
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    current_stock = models.IntegerField(default=0)

    def __str__(self):
        return self.name # Product ko uske naam se dikhana

class Invoice(models.Model):
    # Customer Purchase (Invoice) ki main details
    invoice_date = models.DateTimeField(auto_now_add=True)
    sub_total = models.DecimalField(max_digits=10, decimal_places=2)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    

    def __str__(self):
        # Invoice ko ID aur Date se dikhana sahi hai
        return f"Invoice #{self.id} on {self.invoice_date.strftime('%Y-%m-%d')}"

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT) 
    
    quantity_sold = models.IntegerField()
    unit_price_at_sale = models.DecimalField(max_digits=10, decimal_places=2) 
    
    # Only ONE __str__ function for InvoiceItem
    def __str__(self):
        # InvoiceItem ko Product ke naam aur quantity se dikhana
        return f"{self.product.name} ({self.quantity_sold})"