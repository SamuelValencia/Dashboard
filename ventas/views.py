from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime

def index(request):
    return render(request, 'index.html')

@csrf_exempt
@api_view(['GET'])
def get_categories(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT "Category"
            FROM superstore_final_dataset
            ORDER BY "Category";
        """)
        categories = [row[0] for row in cursor.fetchall()]
    return Response(categories)

@csrf_exempt
@api_view(['GET'])
def get_subcategories(request):
    category = request.GET.get('category')
    with connection.cursor() as cursor:
        if category:
            cursor.execute("""
                SELECT DISTINCT "Sub_Category"
                FROM superstore_final_dataset
                WHERE "Category" = %s
                ORDER BY "Sub_Category";
            """, [category])
        else:
            cursor.execute("""
                SELECT DISTINCT "Sub_Category"
                FROM superstore_final_dataset
                ORDER BY "Sub_Category";
            """)
        subcategories = [row[0] for row in cursor.fetchall()]
    return Response(subcategories)

@csrf_exempt
@api_view(['GET'])
def get_products(request):
    category = request.GET.get('category')
    subcategory = request.GET.get('subcategory')
    
    with connection.cursor() as cursor:
        query = """
            SELECT DISTINCT 
                "Product_ID",
                "Product_Name",
                "Category",
                "Sub_Category",
                "Sales" as price
            FROM superstore_final_dataset
        """
        
        where_clauses = []
        params = []
        
        if category:
            where_clauses.append('"Category" = %s')
            params.append(category)
        if subcategory:
            where_clauses.append('"Sub_Category" = %s')
            params.append(subcategory)
            
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
            
        query +=  'ORDER BY "Product_Name";'
        
        cursor.execute(query, params)
        products = [{
            'id': idx,
            'product_id': row[0],
            'name': row[1],
            'category': row[2],
            'subcategory': row[3],
            'price': float(row[4])
        } for idx, row in enumerate(cursor.fetchall(), 1)]
    return Response(products)

@csrf_exempt
@api_view(['GET'])
def get_sales(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                "Row_ID",
                "Customer_Name",
                "Product_Name",
                "Order_Date",
                "Sales",
                "City",
                "State"
            FROM superstore_final_dataset
            ORDER BY "Order_Date" DESC;
        """)
        sales = [{
            'id': row[0],
            'customer': row[1],
            'product': row[2],
            'order_date': row[3],
            'total_amount': float(row[4]),
            'city': row[5],
            'state': row[6]
        } for row in cursor.fetchall()]
    return Response(sales)

@csrf_exempt
@api_view(['GET'])
def get_sales_by_date_range(request):
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                DATE("Order_Date") as sale_date,
                SUM("Sales") as daily_total,
                COUNT(*) as num_sales
            FROM superstore_final_dataset
            WHERE "Order_Date" BETWEEN %s AND %s
            GROUP BY DATE("Order_Date")
            ORDER BY sale_date;
        """, [start_date, end_date])
        
        sales_data = [{
            'date': row[0].strftime('%Y-%m-%d'),
            'total_amount': float(row[1]),
            'num_sales': row[2]
        } for row in cursor.fetchall()]
    return Response(sales_data)

@csrf_exempt
@api_view(['GET'])
def get_sales_by_category(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                "Category",
                SUM("Sales") as total_sales,
                COUNT(*) as num_sales
            FROM superstore_final_dataset
            GROUP BY "Category"
            ORDER BY total_sales DESC;
        """)
        
        category_sales = [{
            'category': row[0],
            'total_sales': float(row[1]),
            'num_sales': row[2]
        } for row in cursor.fetchall()]
    return Response(category_sales)

@csrf_exempt
@api_view(['GET'])
def get_top_products(request):
    limit = request.GET.get('limit', 10)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                "Product_Name",
                COUNT(*) as total_quantity,
                SUM("Sales") as total_sales,
                COUNT(*) as num_sales
            FROM superstore_final_dataset
            GROUP BY "Product_Name"
            ORDER BY total_sales DESC
            LIMIT %s;
        """, [limit])
        
        top_products = [{
            'product': row[0],
            'total_quantity': row[1],
            'total_sales': float(row[2]),
            'num_sales': row[3]
        } for row in cursor.fetchall()]
    return Response(top_products)

@csrf_exempt
@api_view(['GET'])
def get_dashboard_stats(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT "Row_ID") as total_sales,
                SUM("Sales") as total_revenue,
                COUNT(DISTINCT "Customer_ID") as total_customers,
                COUNT(DISTINCT "Product_ID") as total_products,
                AVG("Sales") as average_sale,
                (SELECT COUNT(DISTINCT "Category") FROM superstore_final_dataset) as total_categories
            FROM superstore_final_dataset;
        """)
        row = cursor.fetchone()
        
        # Obtener ventas por mes
        cursor.execute("""
            SELECT 
                DATE_TRUNC('month', "Order_Date") as month,
                SUM("Sales") as monthly_sales,
                COUNT(*) as num_sales
            FROM superstore_final_dataset
            GROUP BY DATE_TRUNC('month', "Order_Date")
            ORDER BY month DESC
            LIMIT 12;
        """)
        monthly_sales = [{
            'month': row[0].strftime('%Y-%m'),
            'sales': float(row[1]),
            'count': row[2]
        } for row in cursor.fetchall()]

        cursor.execute("""
            SELECT 
                "Category",
                SUM("Sales") as total_sales,
                COUNT(*) as num_sales
            FROM superstore_final_dataset
            GROUP BY "Category"
            ORDER BY total_sales DESC
            LIMIT 5;
        """)
        top_categories = [{
            'category': row[0],
            'total_sales': float(row[1]),
            'num_sales': row[2]
        } for row in cursor.fetchall()]
        
        stats = {
            'summary': {
                'total_sales': row[0],
                'total_revenue': float(row[1]) if row[1] else 0,
                'total_customers': row[2],
                'total_products': row[3],
                'average_sale': float(row[4]) if row[4] else 0,
                'total_categories': row[5]
            },
            'monthly_sales': monthly_sales,
            'top_categories': top_categories
        }
        
        return Response(stats)


@csrf_exempt
@api_view(['GET'])
def get_states(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT "State"
            FROM superstore_final_dataset
            ORDER BY "State";
        """)
        states = [row[0] for row in cursor.fetchall()]
    return Response(states)

@csrf_exempt
@api_view(['GET'])
def get_cities(request):
    state = request.GET.get('state')
    with connection.cursor() as cursor:
        if state:
            cursor.execute("""
                SELECT DISTINCT "City"
                FROM superstore_final_dataset
                WHERE "State" = %s
                ORDER BY "City";
            """, [state])
        else:
            cursor.execute("""
                SELECT DISTINCT "City"
                FROM superstore_final_dataset
                ORDER BY "City";
            """)
        cities = [row[0] for row in cursor.fetchall()]
    return Response(cities)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from datetime import datetime

from django.db.models import Q
from datetime import datetime

@csrf_exempt
@api_view(['GET'])
def dashboard_stats(request):
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    category = request.GET.get('category')
    subcategory = request.GET.get('subcategory')
    state = request.GET.get('state')
    city = request.GET.get('city')
    base_query = Q()
    if start_date and end_date:
        try:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                end = datetime.strptime(end_date, '%Y-%m-%d')
            except ValueError:
                start = datetime.strptime(start_date, '%m/%d/%Y')
                end = datetime.strptime(end_date, '%m/%d/%Y')
            base_query &= Q(Order_Date__range=[start, end])
        except ValueError:
            return Response({'error': 'Invalid date format. Use MM/DD/YYYY or YYYY-MM-DD'}, status=400)
    if category and category != 'Todas':
        base_query &= Q(Product__Category=category)
    if subcategory and subcategory != 'Todas':
        base_query &= Q(Product__Sub_Category=subcategory)
    
    if state and state != 'Todos':
        base_query &= Q(Customer__State=state)
    if city and city != 'Todas':
        base_query &= Q(Customer__City=city)
    with connection.cursor() as cursor:
        where_clauses = []
        params = []

        if start_date and end_date:
            where_clauses.append('"Order_Date"::date BETWEEN %s AND %s')
            params.extend([start_date, end_date])
        if category:
            where_clauses.append('"Category" = %s')
            params.append(category)
        if subcategory:
            where_clauses.append('"Sub_Category" = %s')
            params.append(subcategory)
        if state:
            where_clauses.append('"State" = %s')
            params.append(state)
        if city:
            where_clauses.append('"City" = %s')
            params.append(city)

        where_sql = ' WHERE ' + ' AND '.join(where_clauses) if where_clauses else ''

        # Total ventas
        cursor.execute(
            "SELECT COALESCE(SUM(\"Sales\"), 0) AS TotalVenta FROM superstore_final_dataset" + where_sql,
            params
        )
        total_sales = cursor.fetchone()[0]

        # Ventas por segmento
        cursor.execute(
            """SELECT "Segment", COALESCE(SUM("Sales"), 0) AS TotalVenta
               FROM superstore_final_dataset"""
            + where_sql +
            """ GROUP BY "Segment"
                ORDER BY TotalVenta DESC;""",
            params
        )
        sales_by_segment = [{
            'customer__segment': row[0],
            'total': float(row[1])
        } for row in cursor.fetchall()]

        # Top 10 clientes
        cursor.execute(
            """SELECT 
                "Customer_Name", 
                "Segment", 
                "City", 
                "State",
                COALESCE(SUM("Sales"), 0) as total_sales
            FROM 
                superstore_final_dataset"""
            + where_sql +
            """ GROUP BY 
                "Customer_Name", "Segment", "City", "State"
            ORDER BY total_sales DESC
            LIMIT 10;""",
            params
        )
        top_customers = [{
            'name': row[0],
            'segment': row[1],
            'city': row[2],
            'state': row[3],
            'total': float(row[4])
        } for row in cursor.fetchall()]

        # Top 20 productos
        cursor.execute(
            """SELECT 
                "Product_ID", 
                "Category", 
                "Sub_Category", 
                "Product_Name",
                COALESCE(SUM("Sales"), 0) as total_sales
            FROM 
                superstore_final_dataset"""
            + where_sql +
            """ GROUP BY 
                "Product_ID", "Category", "Sub_Category", "Product_Name"
            ORDER BY total_sales DESC
            LIMIT 20;""",
            params
        )
        top_products = [{
            'Product_ID': row[0],
            'Category': row[1],
            'Sub_Category': row[2],
            'Product_Name': row[3],
            'total_sales': float(row[4])
        } for row in cursor.fetchall()]

        # Ventas por fecha
        cursor.execute(
            """SELECT 
                "Order_Date" AS Fecha,
                SUM("Sales") AS TotalVenta
            FROM 
                superstore_final_dataset"""
            + where_sql +
            """ GROUP BY 
                "Order_Date"
            ORDER BY 
                "Order_Date" ASC;""",
            params
        )
        sales_by_date = [{
            'date': row[0],
            'total': row[1]
        } for row in cursor.fetchall()]

        # Ventas por categoría
        cursor.execute(
            """SELECT 
                "Category",
                SUM("Sales") AS TotalVenta
            FROM 
                superstore_final_dataset"""
            + where_sql +
            """ GROUP BY 
                "Category"
            ORDER BY 
                TotalVenta DESC;""",
            params
        )
        sales_by_category = [{
            'category': row[0],
            'total': row[1]
        } for row in cursor.fetchall()]

    return Response({
        'total_sales': float(total_sales) if total_sales else 0,
        'sales_by_segment': sales_by_segment,
        'sales_by_date': sales_by_date,
        'top_customers': top_customers,
        'top_products': top_products,
        'sales_by_category': sales_by_category
    })
