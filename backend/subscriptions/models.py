from django.db import models
from django.conf import settings
from django.utils import timezone


class SubscriptionPlan(models.Model):
    # Available subscription plans 
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='ETB')
    duration_days = models.PositiveIntegerField(default=30)
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.name} - {self.price} {self.currency}"


class UserSubscription(models.Model):
    # User's active subscription
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscribers'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    tx_ref = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.status})"

    def is_valid(self):
        #  Check if subscription is currently active
        if self.status != 'active':
            return False
        if self.end_date and self.end_date < timezone.now():
            return False
        return True

    def activate(self):
        # Activate the subscription with stacking logic
        # Find the latest active and valid subscription for this user
        latest_sub = UserSubscription.objects.filter(
            user=self.user,
            status='active'
        ).exclude(id=self.id).order_by('-end_date').first()

        now = timezone.now()
        
        if latest_sub and latest_sub.end_date and latest_sub.end_date > now:
            # Stack after the latest subscription
            self.start_date = latest_sub.end_date
        else:
            # Start immediately
            self.start_date = now

        self.status = 'active'
        self.end_date = self.start_date + timezone.timedelta(days=self.plan.duration_days)
        self.save()


class Payment(models.Model):
    # payment transaction records
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    subscription = models.ForeignKey(
        UserSubscription,
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,
        blank=True
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='ETB')
    tx_ref = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    checkout_url = models.URLField(blank=True, null=True)
    chapa_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tx_ref} - {self.amount} {self.currency} ({self.status})"
