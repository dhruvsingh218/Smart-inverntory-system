# inventory_backend/urls.py

from django.contrib import admin # type: ignore
from django.urls import path, include # type: ignore # <-- 'include' import kiya

urlpatterns = [
    path('admin/', admin.site.urls),
    # Saari API requests 'api/' se shuru hongi
    path('api/', include('inventory_app.urls')), # <-- Yeh line add karein
    
]