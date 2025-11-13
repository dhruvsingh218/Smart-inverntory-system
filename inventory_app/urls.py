# inventory_app/urls.py
from django.urls import path# type: ignore
from .views import ProductListView, ProductDetailByCodeView, PurchaseCreateView, BillGenerateView, AnalyticsView, RecentSalesView, DailyRevenueView # Naya view import kiya
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView# type: ignore

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<str:code>/', ProductDetailByCodeView.as_view(), name='product-detail-by-code'),
    path('purchase/', PurchaseCreateView.as_view(), name='purchase-create'), # Naya Purchase path: yahan POST request aayegi
    path('bill/<int:invoice_id>/', BillGenerateView.as_view(), name='generate-bill'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # Login
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # Token Refresh
    path('bill/<int:invoice_id>/', BillGenerateView.as_view(), name='generate-bill'),
    path('sales/recent/', RecentSalesView.as_view(), name='recent-sales'), # <-- Ye line add karein
    path('sales/daily-revenue/', DailyRevenueView.as_view(), name='daily-revenue'),
    
]