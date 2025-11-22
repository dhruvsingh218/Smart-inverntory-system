# inventory_app/serializers.py
from rest_framework import serializers # type: ignore
from .models import Product, Invoice, InvoiceItem # Naye models import kiye

# 1. Invoice Item Serializer
class InvoiceItemSerializer(serializers.ModelSerializer):
    # product_code ko front-end se lene ke liye (instead of ID)
    product_code = serializers.CharField(write_only=True) 
    
    class Meta:
        model = InvoiceItem
        fields = ['product_code', 'quantity_sold', 'unit_price_at_sale'] 
        # 'product_code' ko 'product' Foreign Key mein convert karne ka logic hum view mein likhenge

# 2. Main Invoice Serializer
class InvoiceSerializer(serializers.ModelSerializer):
    # 'items' field se InvoiceItemSerializer ko handle karna
    items = InvoiceItemSerializer(many=True) 

    class Meta:
        model = Invoice
        fields = ['id','sub_total', 'gst_amount', 'grand_total', 'items']

    # Jab koi POST request aati hai, toh yeh function chalta hai
    def create(self, validated_data):
        # Bill ke items nikal liye
        items_data = validated_data.pop('items')
        
        # Pehle Invoice banao
        invoice = Invoice.objects.create(**validated_data)
        
        # Ab har item ko save karo aur Inventory update karo
        for item_data in items_data:
            # Code se Product object dhoondhna
            product_code = item_data.pop('product_code')
            product = Product.objects.get(code=product_code)
            
            # Inventory Auto-Reduce ka Logic!
            if product.current_stock >= item_data['quantity_sold']:
                product.current_stock -= item_data['quantity_sold']
                product.save() # Inventory update hui
            else:
                # Agar stock kam hai, toh sale nahi honi chahiye (Real-world logic)
                raise serializers.ValidationError(
                    f"Not enough stock for {product.name}. Available: {product.current_stock}"
                )

            # InvoiceItem record banana
            InvoiceItem.objects.create(
                invoice=invoice,
                product=product,
                **item_data
            )
        
        return invoice

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        # Kaunse model ke liye serializer banana hai
        model = Product
        # Kaunse fields API response mein dikhane hain
        fields = ['id', 'name', 'code', 'cost_price', 'selling_price', 'current_stock']