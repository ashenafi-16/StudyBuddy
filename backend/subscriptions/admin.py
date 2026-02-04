from django.contrib import admin
from .models import SubscriptionPlan, UserSubscription, Payment


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'currency', 'duration_days', 'is_active', 'is_popular']
    list_filter = ['is_active', 'is_popular']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'start_date', 'end_date', 'created_at']
    list_filter = ['status', 'plan']
    search_fields = ['user__username', 'user__email', 'tx_ref']
    raw_id_fields = ['user']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['tx_ref', 'user', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'currency']
    search_fields = ['tx_ref', 'user__username', 'user__email']
    raw_id_fields = ['user', 'subscription']
