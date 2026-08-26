from django.conf import settings

from google.genai import types

from .gemini import function_calls, function_tool, generate_content, response_text
from .query_tools import QUERY_TOOL_DEFINITIONS, QUERY_TOOLS


def answer_business_question(business, question):
    if not settings.GEMINI_API_KEY:
        return {'answer': 'AI reporting is not configured yet.', 'data_used': {}}

    initial = generate_content(
        question,
        system_instruction='Answer the business question using only the results of the provided read-only tools. Do not invent, estimate, or calculate numbers. Select one or more tools when needed.',
        tools=[function_tool(QUERY_TOOL_DEFINITIONS)],
    )
    calls = function_calls(initial)
    data_used = {}
    tool_parts = []
    for call in calls:
        name = call.name
        function = QUERY_TOOLS.get(name)
        if function is None:
            continue
        result = function(business, **dict(call.args or {}))
        data_used[name] = result
        tool_parts.append(types.Part.from_function_response(name=name, response=result))
    if not tool_parts:
        return {'answer': 'I could not find a supported data query for that question.', 'data_used': {}}

    final = generate_content(
        [
            types.Content(role='user', parts=[types.Part.from_text(text=question)]),
            initial.candidates[0].content,
            types.Content(role='user', parts=tool_parts),
        ],
        system_instruction='Compose a plain-language answer for a small business owner using only the tool results below. Do not introduce any number that is not present in the tool results, and do not perform new calculations.',
    )
    return {'answer': response_text(final) or 'No answer was returned.', 'data_used': data_used}