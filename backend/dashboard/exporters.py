import csv
from django.http import HttpResponse
import openpyxl

def export_to_csv(queryset, fields, filename="export.csv"):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    writer.writerow(fields)
    for obj in queryset:
        row = [getattr(obj, field, '') for field in fields]
        writer.writerow(row)
    return response

def export_to_excel(queryset, fields, filename="export.xlsx"):
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(fields)
    for obj in queryset:
        row = [str(getattr(obj, field, '')) for field in fields]
        ws.append(row)
    wb.save(response)
    return response
