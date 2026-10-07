import json
from datetime import date, timedelta
from decimal import Decimal
from urllib.parse import urlencode

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from billing.models import Payment
from billing.views import paystack_request
from businesses.models import StorefrontOrder
from invoices.models import InvoicePayment
from referrals.models import Payout


class Command(BaseCommand):
    help = 'Compare local Paystack membership and referral payout records with Paystack.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--from-date',
            type=date.fromisoformat,
            default=timezone.localdate() - timedelta(days=30),
            help='Include local and Paystack records from this date (YYYY-MM-DD).',
        )

    def _fetch_all(self, resource, from_date):
        page = 1
        entries = []
        from_value = f'{from_date.isoformat()}T00:00:00Z'
        to_value = f'{timezone.localdate().isoformat()}T23:59:59Z'
        while True:
            query = urlencode({
                'perPage': 100,
                'page': page,
                'from': from_value,
                'to': to_value,
            })
            response = paystack_request(f'{resource}?{query}')
            if not response or not response.get('status'):
                raise CommandError(f'Paystack {resource} request failed on page {page}.')
            page_entries = response.get('data') or []
            if not isinstance(page_entries, list):
                raise CommandError(f'Paystack {resource} response did not contain a record list.')
            entries.extend(page_entries)
            pagination = (response.get('meta') or {}).get('pagination') or {}
            page_count = pagination.get('pageCount')
            if not page_entries or len(page_entries) < 100 or (page_count and page >= int(page_count)):
                break
            page += 1
        return entries

    @staticmethod
    def _kobo(amount):
        return int((Decimal(str(amount or 0)) * 100).quantize(Decimal('1')))

    def handle(self, *args, **options):
        from_date = options['from_date']
        transactions = self._fetch_all('transaction', from_date)
        transfers = self._fetch_all('transfer', from_date)
        transaction_by_reference = {
            str(item.get('reference') or ''): item
            for item in transactions
            if item.get('reference')
        }
        transfer_by_reference = {
            str(item.get('reference') or ''): item
            for item in transfers
            if item.get('reference')
        }
        transfer_by_code = {
            str(item.get('transfer_code') or ''): item
            for item in transfers
            if item.get('transfer_code')
        }
        mismatches = []
        checked = {'transactions': 0, 'transfers': 0}

        local_transactions = []
        local_transactions.extend(
            ('membership', payment.reference, self._kobo(payment.amount), payment.status)
            for payment in Payment.objects.filter(provider='paystack', created_at__date__gte=from_date)
        )
        local_transactions.extend(
            ('invoice', payment.paystack_reference, self._kobo(payment.amount), 'success')
            for payment in InvoicePayment.objects.filter(paid_at__date__gte=from_date)
        )
        local_transactions.extend(
            (
                'storefront',
                order.paystack_reference,
                self._kobo(order.total),
                'success' if order.status == StorefrontOrder.STATUS_PAID else 'pending',
            )
            for order in StorefrontOrder.objects.filter(
                created_at__date__gte=from_date,
            ).exclude(paystack_reference='')
        )

        for payment_type, reference, amount, local_status in local_transactions:
            checked['transactions'] += 1
            remote = transaction_by_reference.get(reference)
            if remote is None:
                mismatches.append({
                    'kind': 'transaction_missing_on_paystack',
                    'type': payment_type,
                    'reference': reference,
                })
                continue
            remote_status = str(remote.get('status') or '').lower()
            status_matches = (
                remote_status in {'success', 'paid'}
                if local_status == 'paid' or local_status == 'success'
                else remote_status == str(local_status).lower()
            )
            remote_amount = int(remote.get('amount') or 0)
            if remote_amount != amount or not status_matches:
                mismatches.append({
                    'kind': 'transaction_mismatch',
                    'type': payment_type,
                    'reference': reference,
                    'local_amount': amount,
                    'paystack_amount': remote_amount,
                    'local_status': local_status,
                    'paystack_status': remote_status,
                })

        local_transaction_references = {
            str(reference)
            for _, reference, _, _ in local_transactions
            if reference
        }
        for reference, remote in transaction_by_reference.items():
            metadata = remote.get('metadata') or {}
            payment_type = str(metadata.get('payment_type') or '').lower()
            metadata_type = str(metadata.get('type') or '').lower()
            is_managed = (
                payment_type in {'invoice', 'storefront_order', 'membership', 'subscription'}
                or metadata_type == 'membership'
                or bool(metadata.get('business_id') and metadata.get('plan_id'))
            )
            if is_managed and reference not in local_transaction_references:
                mismatches.append({
                    'kind': 'transaction_missing_locally',
                    'reference': reference,
                    'paystack_status': str(remote.get('status') or '').lower(),
                    'paystack_amount': int(remote.get('amount') or 0),
                })

        status_map = {
            Payout.STATUS_PROCESSING: {'pending', 'otp'},
            Payout.STATUS_SUCCESS: {'success'},
            Payout.STATUS_FAILED: {'failed', 'rejected'},
            Payout.STATUS_REVERSED: {'reversed'},
        }
        for payout in Payout.objects.filter(created_at__date__gte=from_date):
            checked['transfers'] += 1
            remote = transfer_by_code.get(payout.paystack_transfer_code) if payout.paystack_transfer_code else None
            if remote is None:
                remote = transfer_by_reference.get(payout.reference)
            if remote is None:
                mismatches.append({
                    'kind': 'transfer_missing_on_paystack',
                    'reference': payout.reference,
                    'transfer_code': payout.paystack_transfer_code,
                })
                continue
            remote_status = str(remote.get('status') or '').lower()
            remote_amount = int(remote.get('amount') or 0)
            if remote_amount != payout.amount or remote_status not in status_map.get(payout.status, set()):
                mismatches.append({
                    'kind': 'transfer_mismatch',
                    'reference': payout.reference,
                    'local_amount': payout.amount,
                    'paystack_amount': remote_amount,
                    'local_status': payout.status,
                    'paystack_status': remote_status,
                })

        local_transfer_references = set(
            Payout.objects.filter(created_at__date__gte=from_date)
            .values_list('reference', flat=True)
        )
        local_transfer_codes = set(
            Payout.objects.filter(created_at__date__gte=from_date)
            .exclude(paystack_transfer_code='')
            .values_list('paystack_transfer_code', flat=True)
        )
        for reference, remote in transfer_by_reference.items():
            transfer_code = str(remote.get('transfer_code') or '')
            if reference not in local_transfer_references and transfer_code not in local_transfer_codes:
                mismatches.append({
                    'kind': 'transfer_missing_locally',
                    'reference': reference,
                    'transfer_code': transfer_code,
                    'paystack_status': str(remote.get('status') or '').lower(),
                    'paystack_amount': int(remote.get('amount') or 0),
                })

        report = {
            'from_date': from_date.isoformat(),
            'checked': checked,
            'mismatch_count': len(mismatches),
            'mismatches': mismatches,
        }
        self.stdout.write(json.dumps(report, indent=2))
