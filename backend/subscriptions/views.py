from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
import json
import hmac
import hashlib
from django.conf import settings

from .models import SubscriptionPlan, UserSubscription, Payment
from .serializers import (
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
    PaymentSerializer,
    InitiatePaymentSerializer,
    VerifyPaymentSerializer
)
from .chapa_service import chapa_service


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    # Listing subscription plan
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]


class SubscriptionViewSet(viewsets.ViewSet):
    # subscription management
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_subscription(self, request):
        # Get all of current user's valid subscriptions
        subscriptions = UserSubscription.objects.filter(
            user=request.user,
            status='active'
        )
        
        # Filter for only valid ones (not expired)
        valid_subs = [s for s in subscriptions if s.is_valid()]
        
        if valid_subs:
            serializer = UserSubscriptionSerializer(valid_subs, many=True)
            return Response({
                'has_subscription': True,
                'subscriptions': serializer.data
            })
        
        return Response({
            'has_subscription': False,
            'subscriptions': [],
            'message': 'No active subscription found'
        })
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        # Get user's subscription history
        subscriptions = UserSubscription.objects.filter(user=request.user)
        serializer = UserSubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        # Initiate subscription payment
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        plan = get_object_or_404(
            SubscriptionPlan, 
            id=serializer.validated_data['plan_id'],
            is_active=True
        )
        
        # Check for existing pending subscription
        existing = UserSubscription.objects.filter(
            user=request.user,
            plan=plan,
            status='pending'
        ).first()
        
        if existing:
            # Return existing payment checkout URL
            payment = Payment.objects.filter(
                subscription=existing,
                status='pending'
            ).first()
            if payment and payment.checkout_url:
                return Response({
                    'checkout_url': payment.checkout_url,
                    'tx_ref': payment.tx_ref,
                    'message': 'Continue with existing payment'
                })
        
        # Generate transaction reference
        tx_ref = chapa_service.generate_tx_ref()
        
        return_url = serializer.validated_data.get(
            'return_url',
            f"{settings.FRONTEND_URL}/subscription/verify?tx_ref={tx_ref}"
        )
        
        # Get callback URL for webhook
        callback_url = request.build_absolute_uri('/api/subscriptions/webhook/')
        
        # Get user info
        user = request.user
        first_name = user.first_name or user.username
        last_name = user.last_name or ''
        
        # Initialize payment with Chapa
        result = chapa_service.initialize_payment(
            amount=float(plan.price),
            email=user.email,
            first_name=first_name,
            last_name=last_name,
            tx_ref=tx_ref,
            callback_url=callback_url,
            return_url=return_url,
            customization={
                "title": "StudyBuddy Sub",
                "description": f"Subscribe to {plan.name} plan"
            }
        )
        
        if not result['success']:
            return Response({
                'error': result.get('message', 'Payment initialization failed')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create subscription record
        subscription = UserSubscription.objects.create(
            user=user,
            plan=plan,
            tx_ref=tx_ref,
            status='pending'
        )
        
        # Create payment record
        Payment.objects.create(
            user=user,
            subscription=subscription,
            amount=plan.price,
            currency=plan.currency,
            tx_ref=tx_ref,
            status='pending',
            checkout_url=result['checkout_url'],
            chapa_response=result.get('data', {})
        )
        
        return Response({
            'checkout_url': result['checkout_url'],
            'tx_ref': tx_ref,
            'plan': SubscriptionPlanSerializer(plan).data
        })
    
    @action(detail=False, methods=['post', 'get'])
    def verify(self, request):
        """Verify payment and activate subscription"""
        tx_ref = request.data.get('tx_ref') or request.query_params.get('tx_ref')
        
        if not tx_ref:
            return Response({
                'error': 'Transaction reference required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get subscription
        subscription = get_object_or_404(UserSubscription, tx_ref=tx_ref, user=request.user)
        
        # Check if already active
        if subscription.status == 'active':
            return Response({
                'message': 'Subscription already active',
                'subscription': UserSubscriptionSerializer(subscription).data
            })
        
        # Verify with Chapa
        result = chapa_service.verify_payment(tx_ref)
        
        # Update payment record
        payment = Payment.objects.filter(tx_ref=tx_ref).first()
        if payment:
            payment.chapa_response = result.get('data', {})
            
            if result['success'] and result['verified']:
                payment.status = 'success'
                payment.save()
                
                # Activate subscription
                subscription.activate()
                
                return Response({
                    'message': 'Payment verified and subscription activated',
                    'subscription': UserSubscriptionSerializer(subscription).data
                })
            else:
                payment.status = 'failed'
                payment.save()
                subscription.status = 'cancelled'
                subscription.save()
                
                return Response({
                    'error': 'Payment verification failed',
                    'message': result.get('message', 'Unknown error')
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'error': 'Payment record not found'
        }, status=status.HTTP_404_NOT_FOUND)


@method_decorator(csrf_exempt, name='dispatch')
class ChapaWebhookView(APIView):
    permission_classes = []

    def post(self, request):
        try:
            signature = request.headers.get('Chapa-Signature')
            payload = request.body

            computed_signature = hmac.new(
                settings.CHAPA_WEBHOOK_SECRET.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()

            if signature != computed_signature:
                return HttpResponse(status=400)

            data = json.loads(payload)
            tx_ref = data.get('tx_ref')

            if not tx_ref:
                return HttpResponse(status=400)

            result = chapa_service.verify_payment(tx_ref)

            if result['success'] and result['verified']:
                payment = Payment.objects.filter(tx_ref=tx_ref).first()

                if payment and payment.status != 'success':
                    payment.status = 'success'
                    payment.chapa_response = result.get('data', {})
                    payment.save()

                    if payment.subscription:
                        payment.subscription.activate()

            return HttpResponse(status=200)

        except Exception as e:
            print("Webhook error:", e)
            return HttpResponse(status=500)
