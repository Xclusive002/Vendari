from django.apps import AppConfig
from django.db.models.signals import post_save


class ReferralsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'referrals'

    def ready(self):
        from referrals.fraud import refresh_referral_fraud_flags
        from referrals.models import PayoutAccount, Referral
        import referrals.signals  # noqa: F401

        def check_referral_fraud(sender, instance, created, **kwargs):
            if created:
                refresh_referral_fraud_flags(instance.referrer)

        def check_payout_name(sender, instance, **kwargs):
            refresh_referral_fraud_flags(instance.user)

        post_save.connect(check_referral_fraud, sender=Referral, dispatch_uid='referrals.flag_signup_patterns')
        post_save.connect(check_payout_name, sender=PayoutAccount, dispatch_uid='referrals.flag_payout_name')
