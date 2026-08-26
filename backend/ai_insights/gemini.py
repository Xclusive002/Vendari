import time

from google import genai
from google.genai import types
from django.conf import settings


MAX_ATTEMPTS = 3


class GeminiRateLimitError(Exception):
    pass


def _is_rate_limit(error):
    return getattr(error, 'code', None) == 429 or getattr(error, 'status_code', None) == 429 or '429' in str(error)


def get_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def generate_content(contents, *, system_instruction=None, tools=None, response_mime_type=None):
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        tools=tools,
        response_mime_type=response_mime_type,
    )
    client = get_client()
    try:
        for attempt in range(MAX_ATTEMPTS):
            try:
                return client.models.generate_content(model=settings.GEMINI_MODEL, contents=contents, config=config)
            except Exception as error:
                if not _is_rate_limit(error):
                    raise
                if attempt == MAX_ATTEMPTS - 1:
                    raise GeminiRateLimitError('Gemini is busy, try again in a moment.') from error
                time.sleep(2 ** attempt)
    finally:
        client.close()


def response_text(response):
    return (getattr(response, 'text', '') or '').strip()


def function_calls(response):
    calls = []
    for part in getattr(getattr(getattr(response, 'candidates', [None])[0], 'content', None), 'parts', []) or []:
        function_call = getattr(part, 'function_call', None)
        if function_call and getattr(function_call, 'name', None):
            calls.append(function_call)
    return calls


def function_tool(definitions):
    declarations = [
        types.FunctionDeclaration(
            name=definition['name'],
            description=definition['description'],
            parameters_json_schema=definition.get('input_schema', {'type': 'object'}),
        )
        for definition in definitions
    ]
    return types.Tool(function_declarations=declarations)