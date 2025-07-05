import json

def lambda_handler(event, context):
    session = event['request'].get('session', [])
    print("⏱ DefineAuthChallenge invoked, session:", json.dumps(session))

    # Count successes
    successes = sum(1 for c in session if c.get('challengeResult') is True)
    print("✅ successes so far:", successes)

    # 0 challenges yet → issue QA
    if len(session) == 0:
        event['response']['challengeName']      = 'CUSTOM_CHALLENGE'
        event['response']['issueTokens']        = False
        event['response']['failAuthentication'] = False

    # 1 success → issue Caesar
    elif len(session) == 1 and successes == 1:
        event['response']['challengeName']      = 'CUSTOM_CHALLENGE'
        event['response']['issueTokens']        = False
        event['response']['failAuthentication'] = False

    # 2 successes → tokens!
    elif len(session) == 2 and successes == 2:
        event['response']['issueTokens']        = True
        event['response']['failAuthentication'] = False

    # anything else → fail
    else:
        event['response']['issueTokens']        = False
        event['response']['failAuthentication'] = True

    print("⏳ DefineAuthChallenge response:", json.dumps(event['response']))
    return event
