import json
import urllib.error
import urllib.request

from django.conf import settings

from .query_tools import QUERY_TOOL_DEFINITIONS, QUERY_TOOLS


def _anthropic_request(payload):
    request = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=json.dumps(payload).encode(),
        headers={
            'x-api-key': settings.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read())


def _tool_calls(response):
    return [block for block in response.get('content', []) if block.get('type') == 'tool_use']


def answer_business_question(business, question):
    initial = _anthropic_request({
        'model': 'claude-sonnet-4-6',
        'max_tokens': 300,
        'tools': QUERY_TOOL_DEFINITIONS,
        'system': 'Answer the business question using only the results of the provided read-only tools. Do not invent, estimate, or calculate numbers. Select one or more tools when needed.',
        'messages': [{'role': 'user', 'content': question}],
    })
    calls = _tool_calls(initial)
    data_used = {}
    tool_results = []
    for call in calls:
        name = call.get('name')
        function = QUERY_TOOLS.get(name)
        if function is None:
            continue
        result = function(business, **(call.get('input') or {}))
        data_used[name] = result
        tool_results.append({'type': 'tool_result', 'tool_use_id': call['id'], 'content': json.dumps(result, separators=(',', ':'))})
    if not tool_results:
        return {'answer': 'I could not find a supported data query for that question.', 'data_used': {}}

    final = _anthropic_request({
        'model': 'claude-sonnet-4-6',
        'max_tokens': 300,
        'system': 'Compose a plain-language answer for a small business owner using only the tool results below. Do not introduce any number that is not present in the tool results, and do not perform new calculations.',
        'messages': [
            {'role': 'user', 'content': question},
            {'role': 'assistant', 'content': initial.get('content', [])},
            {'role': 'user', 'content': tool_results},
        ],
    })
    answer = ''.join(block.get('text', '') for block in final.get('content', []) if block.get('type') == 'text').strip()
    return {'answer': answer or 'No answer was returned.', 'data_used': data_used}