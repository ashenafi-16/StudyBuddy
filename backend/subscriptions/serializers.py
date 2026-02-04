from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription, Payment


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    # Serializer for subscription plans
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'slug', 'description', 'price', 
            'currency', 'duration_days', 'features', 
            'is_active', 'is_popular'
        ]


class UserSubscriptionSerializer(serializers.ModelSerializer):
    # Serializer for user subscriptions
    plan = SubscriptionPlanSerializer(read_only=True)
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSubscription
        fields = [
            'id', 'plan', 'status', 'start_date', 'end_date',
            'tx_ref', 'is_valid', 'created_at'
        ]
    
    def get_is_valid(self, obj):
        return obj.is_valid()


class PaymentSerializer(serializers.ModelSerializer):
    # Serializer for payment records
    
    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'currency', 'tx_ref', 'status',
            'checkout_url', 'created_at'
        ]
        read_only_fields = ['checkout_url', 'status']


class InitiatePaymentSerializer(serializers.Serializer):
    # Serializer for payment initiation request
    plan_id = serializers.IntegerField()
    return_url = serializers.URLField(required=False)


class VerifyPaymentSerializer(serializers.Serializer):
    # Serializer for payment verification request
    tx_ref = serializers.CharField(max_length=100)
