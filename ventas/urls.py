from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    
    path('categories/', views.get_categories, name='categories'),
    path('subcategories/', views.get_subcategories, name='subcategories'),
    path('products/', views.get_products, name='products'),
    path('sales/', views.get_sales, name='sales'),
    path('sales/by-date/', views.get_sales_by_date_range, name='sales-by-date'),
    path('sales/by-category/', views.get_sales_by_category, name='sales-by-category'),
    path('products/top/', views.get_top_products, name='top-products'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('states/', views.get_states, name='states'),
    path('cities/', views.get_cities, name='cities'),
]
