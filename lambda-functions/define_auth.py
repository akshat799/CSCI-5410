import json

def lambda_handler(event, context):
    session = event['request'].get('session', [])
    print("DefineAuthChallenge invoked, session:", json.dumps(session))
    print("event:", json.dumps(event))
    if len(session) == 1 and session[0]['challengeName'] == 'SRP_A' and session[0]['challengeResult']:
        event['response']['challengeName']      = 'PASSWORD_VERIFIER'
        event['response']['issueTokens']        = False
        event['response']['failAuthentication'] = False
    elif len(session) == 2 and session[1]['challengeName'] == "PASSWORD_VERIFIER" and session[1]['challengeResult']:
        event['response']['challengeName']      = 'CUSTOM_CHALLENGE'
        event['response']['issueTokens']        = False
        event['response']['failAuthentication'] = False

    elif len(session) == 3 and session[2]['challengeName'] == "CUSTOM_CHALLENGE" and session[1]['challengeResult']:
        event['response']['challengeName']      = 'CUSTOM_CHALLENGE'
        event['response']['issueTokens']        = False
        event['response']['failAuthentication'] = False

    elif len(session) == 4 and session[3]['challengeName'] == "CUSTOM_CHALLENGE" and session[3]['challengeResult']:
        event['response']['issueTokens']        = True
        event['response']['failAuthentication'] = False
    else:
        event['response']['issueTokens']        = False
        event['response']['failAuthentication'] = True

    print("DefineAuthChallenge response:", json.dumps(event['response']))
    return event
