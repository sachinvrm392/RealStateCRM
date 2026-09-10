from django.db import models
from projects.models import Project

class Plot(models.Model):
    TYPE_CHOICES = (
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
        ('mixed', 'Mixed'),
    )
    FACING_CHOICES = (
        ('east', 'East'),
        ('west', 'West'),
        ('north', 'North'),
        ('south', 'South'),
        ('corner', 'Corner'),
    )
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('sold', 'Sold'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='plots')
    plot_number = models.CharField(max_length=50)
    block_sector = models.CharField(max_length=50, blank=True, null=True)
    area_sqft = models.DecimalField(max_digits=10, decimal_places=2)
    plot_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='residential')
    facing = models.CharField(max_length=20, choices=FACING_CHOICES, blank=True, null=True)
    price_per_sqft = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    
    dimensions = models.CharField(max_length=50, blank=True, null=True)
    floor_level = models.IntegerField(blank=True, null=True)
    amenities = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['project', 'plot_number']

    def __str__(self):
        return f"{self.project.name} - Plot {self.plot_number}"
