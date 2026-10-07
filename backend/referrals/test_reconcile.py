import json
from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone


class ReconcileReferralsCommandTests(TestCase):
    @patch('billing.views.paystack_request')
    def test_reports_paystack_only_managed_transactions_and_transfers(self, paystack_request):
        paystack_request.side_effect = [
            {
                'status': True,
                'data': [{
                    'reference': 'orphan-membership-payment',
                    'status': 'success',
                    'amount': 500000,
                    'metadata': {'type': 'membership'},
                }],
            },
            {
                'status': True,
                'data': [{
                    'reference': 'orphan-referral-transfer',
                    'transfer_code': 'TRF_ORPHAN',
                    'status': 'success',
                    'amount': 100000,
                }],
            },
        ]
        output = StringIO()

        call_command(
            'reconcile_referrals',
            from_date=timezone.localdate() - timedelta(days=30),
            stdout=output,
        )

        report = json.loads(output.getvalue())
        mismatch_kinds = {item['kind'] for item in report['mismatches']}
        self.assertIn('transaction_missing_locally', mismatch_kinds)
        self.assertIn('transfer_missing_locally', mismatch_kinds)
