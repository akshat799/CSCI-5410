def lambda_handler(event, context):
    session = event['request'].get('session', [])

    if len(session) == 0:
        event['response']['challengeName'] = 'PASSWORD_VERIFIER'
        event['response']['issueTokens'] = False
        event['response']['failAuthentication'] = False
    elif len(session) == 1:
        event['response']['challengeName'] = 'CUSTOM_CHALLENGE'
        event['response']['issueTokens'] = False
        event['response']['failAuthentication'] = False
    elif len(session) == 2:
        event['response']['challengeName'] = 'CUSTOM_CHALLENGE'
        event['response']['issueTokens'] = False
        event['response']['failAuthentication'] = False
    elif len(session) == 3 and session[-1].get('challengeResult'):
        event['response']['issueTokens'] = True
        event['response']['failAuthentication'] = False
    else:
        event['response']['issueTokens'] = False
        event['response']['failAuthentication'] = True

    return event
