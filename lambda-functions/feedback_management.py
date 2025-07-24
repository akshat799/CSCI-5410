import boto3
import json
import uuid
from datetime import datetime
from decimal import Decimal
import os

# Initialize services
try:
    dynamodb = boto3.resource('dynamodb')
    feedback_table = dynamodb.Table('CustomerFeedback')
    comprehend = boto3.client('comprehend')
    print("Successfully initialized AWS services")
except Exception as e:
    print(f"Error initializing AWS services: {str(e)}")

def lambda_handler(event, context):
    try:
        print(f"Received event: {json.dumps(event)}")
        
        # Check if this is a simple health check
        if event.get('httpMethod') == 'GET' and not event.get('pathParameters'):
            # This is GET /feedback - return empty response if no data
            try:
                return get_feedback({})
            except Exception as e:
                print(f"Error in get_feedback: {str(e)}")
                # Return empty feedback list if table doesn't exist yet
                return create_response(200, {
                    'feedback': [],
                    'statistics': {
                        'average_rating': 0,
                        'total_feedback': 0,
                        'sentiment_breakdown': {'POSITIVE': 0, 'NEGATIVE': 0, 'NEUTRAL': 0, 'MIXED': 0},
                        'rating_breakdown': {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}
                    },
                    'count': 0
                })
        
        # Extract user info from Cognito JWT token
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        
        http_method = event['httpMethod']
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        print(f"HTTP Method: {http_method}")
        print(f"Path Parameters: {path_parameters}")
        
        if http_method == 'POST':
            # Submit feedback - requires authentication
            if not claims:
                return create_response(401, {'message': 'Authentication required'})
            
            body = json.loads(event.get('body', '{}'))
            return submit_feedback(body, claims)
            
        elif http_method == 'GET' and path_parameters.get('bike_id'):
            # Get feedback for specific bike - public access
            return get_bike_feedback(path_parameters['bike_id'])
            
        elif http_method == 'GET':
            # Get all feedback or filtered feedback - public access
            return get_feedback(query_parameters)
            
        else:
            return create_response(400, {'message': 'Invalid request'})

    except Exception as e:
        print(f"Lambda handler error: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(500, {
            'message': 'Internal server error',
            'error': str(e),
            'debug': 'Check CloudWatch logs for details'
        })

def analyze_sentiment(text):
    """Analyze sentiment using AWS Comprehend with detailed analysis"""
    try:
        # Detect sentiment
        sentiment_response = comprehend.detect_sentiment(
            Text=text,
            LanguageCode='en'
        )
        
        sentiment = sentiment_response['Sentiment']
        scores = sentiment_response['SentimentScore']
        
        # Get the dominant sentiment score
        dominant_score = scores.get(sentiment.capitalize(), 0.0)
        
        # Extract key phrases for additional insights
        key_phrases = []
        try:
            keyphrases_response = comprehend.detect_key_phrases(
                Text=text,
                LanguageCode='en'
            )
            key_phrases = [phrase['Text'] for phrase in keyphrases_response['KeyPhrases'][:5]]
        except Exception as e:
            print(f"Error extracting key phrases: {str(e)}")
        
        # Detect entities (optional - for better insights)
        entities = []
        try:
            entities_response = comprehend.detect_entities(
                Text=text,
                LanguageCode='en'
            )
            entities = [
                {
                    'text': entity['Text'], 
                    'type': entity['Type'],
                    'confidence': entity['Score']
                } 
                for entity in entities_response['Entities'][:3]
            ]
        except Exception as e:
            print(f"Error detecting entities: {str(e)}")
        
        return {
            'sentiment': sentiment,
            'score': dominant_score,
            'all_scores': {
                'positive': scores.get('Positive', 0.0),
                'negative': scores.get('Negative', 0.0),
                'neutral': scores.get('Neutral', 0.0),
                'mixed': scores.get('Mixed', 0.0)
            },
            'key_phrases': key_phrases,
            'entities': entities,
            'confidence': dominant_score
        }
        
    except Exception as e:
        print(f"Error analyzing sentiment with Comprehend: {str(e)}")
        # Fallback to basic sentiment analysis based on common words
        return analyze_sentiment_fallback(text)

def analyze_sentiment_fallback(text):
    """Fallback sentiment analysis when Comprehend fails"""
    text_lower = text.lower()
    
    # Basic positive/negative word lists
    positive_words = [
        'good', 'great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'awesome', 
        'perfect', 'love', 'best', 'outstanding', 'brilliant', 'superb', 'nice',
        'smooth', 'comfortable', 'easy', 'fast', 'reliable', 'clean', 'fun'
    ]
    
    negative_words = [
        'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'broken', 'slow',
        'uncomfortable', 'dirty', 'expensive', 'difficult', 'problem', 'issue',
        'fault', 'error', 'poor', 'disappointing', 'frustrating', 'annoying'
    ]
    
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    if positive_count > negative_count:
        sentiment = 'POSITIVE'
        score = min(0.8, 0.5 + (positive_count * 0.1))
    elif negative_count > positive_count:
        sentiment = 'NEGATIVE'
        score = min(0.8, 0.5 + (negative_count * 0.1))
    else:
        sentiment = 'NEUTRAL'
        score = 0.5
    
    return {
        'sentiment': sentiment,
        'score': score,
        'all_scores': {
            'positive': score if sentiment == 'POSITIVE' else 0.2,
            'negative': score if sentiment == 'NEGATIVE' else 0.2,
            'neutral': score if sentiment == 'NEUTRAL' else 0.6,
            'mixed': 0.1
        },
        'key_phrases': [],
        'entities': [],
        'confidence': score,
        'fallback': True
    }

def submit_feedback(feedback_data, claims):
    try:
        # Validate required fields
        required_fields = ['bike_id', 'rating', 'comment']
        for field in required_fields:
            if field not in feedback_data:
                return create_response(400, {'message': f'Missing required field: {field}'})
        
        rating = feedback_data.get('rating')
        if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            return create_response(400, {'message': 'Rating must be between 1 and 5'})
        
        comment = feedback_data.get('comment', '').strip()
        if len(comment) < 10:
            return create_response(400, {'message': 'Comment must be at least 10 characters long'})
        
        if len(comment) > 1000:
            return create_response(400, {'message': 'Comment must be less than 1000 characters'})
        
        # Perform comprehensive sentiment analysis using Amazon Comprehend
        print(f"Analyzing sentiment for comment: {comment[:100]}...")
        sentiment_data = analyze_sentiment(comment)
        print(f"Sentiment analysis result: {sentiment_data}")
        
        feedback_id = str(uuid.uuid4())
        customer_id = claims.get('sub') or claims.get('username', 'unknown')
        
        feedback_item = {
            'feedback_id': feedback_id,
            'bike_id': feedback_data['bike_id'],
            'customer_id': customer_id,
            'customer_email': claims.get('email', ''),
            'rating': Decimal(str(rating)),
            'comment': comment,
            'sentiment': sentiment_data['sentiment'],
            'sentiment_score': Decimal(str(sentiment_data['score'])),
            'sentiment_scores': {
                'positive': Decimal(str(sentiment_data['all_scores']['positive'])),
                'negative': Decimal(str(sentiment_data['all_scores']['negative'])),
                'neutral': Decimal(str(sentiment_data['all_scores']['neutral'])),
                'mixed': Decimal(str(sentiment_data['all_scores']['mixed']))
            },
            'key_phrases': sentiment_data.get('key_phrases', []),
            'entities': [
                {
                    'text': entity['text'],
                    'type': entity['type'],
                    'confidence': Decimal(str(entity['confidence']))
                } for entity in sentiment_data.get('entities', [])
            ],
            'confidence': Decimal(str(sentiment_data['confidence'])),
            'analysis_method': 'fallback' if sentiment_data.get('fallback') else 'comprehend',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        feedback_table.put_item(Item=feedback_item)
        
        # Convert Decimal for JSON response
        response_feedback = json.loads(json.dumps(feedback_item, default=decimal_default))
        
        return create_response(201, {
            'message': 'Feedback submitted successfully',
            'feedback_id': feedback_id,
            'feedback': response_feedback,
            'sentiment_analysis': {
                'sentiment': sentiment_data['sentiment'],
                'confidence': sentiment_data['confidence'],
                'key_phrases': sentiment_data.get('key_phrases', []),
                'method': sentiment_data.get('fallback', False) and 'fallback' or 'comprehend'
            }
        })
        
    except Exception as e:
        print(f"Error submitting feedback: {str(e)}")
        return create_response(500, {'message': 'Failed to submit feedback'})

def get_bike_feedback(bike_id):
    try:
        # Get all feedback for a specific bike
        response = feedback_table.query(
            IndexName='BikeIdIndex',
            KeyConditionExpression='bike_id = :bike_id',
            ExpressionAttributeValues={':bike_id': bike_id}
        )
        
        feedback_list = response.get('Items', [])
        
        # Calculate statistics
        stats = calculate_feedback_stats(feedback_list)
        
        # Convert Decimal values for JSON
        feedback_list = json.loads(json.dumps(feedback_list, default=decimal_default))
        stats = json.loads(json.dumps(stats, default=decimal_default))
        
        return create_response(200, {
            'bike_id': bike_id,
            'feedback': feedback_list,
            'statistics': stats,
            'count': len(feedback_list)
        })
        
    except Exception as e:
        print(f"Error getting bike feedback: {str(e)}")
        return create_response(500, {'message': 'Failed to retrieve feedback'})

def get_feedback(query_parameters):
    try:
        customer_id = query_parameters.get('customer_id')
        limit = int(query_parameters.get('limit', 50))
        
        if limit > 100:
            limit = 100
        
        # Check if table exists
        try:
            if customer_id:
                # Get feedback by customer
                response = feedback_table.query(
                    IndexName='CustomerIdIndex',
                    KeyConditionExpression='customer_id = :customer_id',
                    ExpressionAttributeValues={':customer_id': customer_id},
                    Limit=limit
                )
            else:
                # Get all feedback (scan)
                response = feedback_table.scan(Limit=limit)
            
            feedback_list = response.get('Items', [])
            
        except Exception as table_error:
            print(f"Table access error: {str(table_error)}")
            # Return empty response if table doesn't exist or can't be accessed
            feedback_list = []
        
        # Sort by created_at descending
        feedback_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Calculate overall statistics
        stats = calculate_feedback_stats(feedback_list)
        
        # Convert Decimal values for JSON
        feedback_list = json.loads(json.dumps(feedback_list, default=decimal_default))
        stats = json.loads(json.dumps(stats, default=decimal_default))
        
        return create_response(200, {
            'feedback': feedback_list,
            'statistics': stats,
            'count': len(feedback_list),
            'message': 'Feedback retrieved successfully' if feedback_list else 'No feedback available yet'
        })
        
    except Exception as e:
        print(f"Error getting feedback: {str(e)}")
        return create_response(500, {'message': 'Failed to retrieve feedback', 'error': str(e)})

def calculate_feedback_stats(feedback_list):
    """Calculate statistics from feedback list"""
    if not feedback_list:
        return {
            'average_rating': 0,
            'total_feedback': 0,
            'sentiment_breakdown': {'POSITIVE': 0, 'NEGATIVE': 0, 'NEUTRAL': 0, 'MIXED': 0},
            'rating_breakdown': {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}
        }
    
    total_rating = 0
    sentiment_counts = {'POSITIVE': 0, 'NEGATIVE': 0, 'NEUTRAL': 0, 'MIXED': 0}
    rating_counts = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}
    
    for feedback in feedback_list:
        rating = float(feedback.get('rating', 0))
        total_rating += rating
        
        sentiment = feedback.get('sentiment', 'NEUTRAL')
        sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
        
        rating_str = str(int(rating))
        if rating_str in rating_counts:
            rating_counts[rating_str] += 1
    
    average_rating = total_rating / len(feedback_list) if feedback_list else 0
    
    return {
        'average_rating': round(average_rating, 2),
        'total_feedback': len(feedback_list),
        'sentiment_breakdown': sentiment_counts,
        'rating_breakdown': rating_counts
    }

def create_response(status_code, body):
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body)
    }

def decimal_default(obj):
    """JSON serializer for Decimal objects"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError