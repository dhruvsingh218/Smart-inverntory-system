# inventory_app/admin.py

from django.contrib import admin # type: ignore
from .models import Product, Invoice, InvoiceItem # <-- Naye models import kiye

# Product model already registered
admin.site.register(Product)

# Invoice aur InvoiceItem ko register karna
admin.site.register(Invoice)
admin.site.register(InvoiceItem)