import boto3
import json

lambda_client = boto3.client('lambda')

def invoke_lambda(function_name, payload):
    try:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        result = json.loads(response['Payload'].read())
        return result.get('valid', False)
    except Exception as e:
        print(f"Error invoking {function_name}: {e}")
        return False

def lambda_handler(event, context):
    user_id = event['userName']
    metadata = event['request'].get('challengeMetadata')
    user_answer = event['request'].get('challengeAnswer')

    if not user_id or not user_answer:
        event['response']['answerCorrect'] = False
        return event

    if metadata == 'QA':
        result = invoke_lambda('QAValidation', {
            'user_id': user_id,
            'answer': user_answer
        })
        event['response']['answerCorrect'] = result

    elif metadata == 'CAESAR':
        result = invoke_lambda('CaesarValidation', {
            'user_id': user_id,
            'answer': user_answer
        })
        event['response']['answerCorrect'] = result

    else:
        event['response']['answerCorrect'] = False

    return event
