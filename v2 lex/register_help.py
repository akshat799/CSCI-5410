import json
import boto3
import uuid

dynamodb = boto3.client('dynamodb')

BOOKINGS_TABLE = "Bookings"
CONCERNS_TABLE = "Concerns"

def lambda_handler(event, context):
    try:
        intent_name = event['sessionState']['intent']['name']

        # --- REGISTER HELP INTENT ---
        if intent_name == "RegisterHelpIntent":
            return format_v2_response(
                "To register, simply go to our website, click on Sign Up, fill in your details and follow the verification steps."
            )

        # --- BOOKING HELP INTENT ---
        elif intent_name == "FindBookingIntent":
            slots = event['sessionState']['intent']['slots']
            booking_slot = slots.get('bookingReference')

            if not booking_slot or not booking_slot.get('value'):
                return format_v2_response("Please provide your booking reference code.")

            booking_reference = booking_slot['value']['interpretedValue'].upper()


            try:
                response = dynamodb.get_item(
                    TableName=BOOKINGS_TABLE,
                    Key={'bookingReference': {'S': booking_reference}}
                )

                if 'Item' not in response:
                    return format_v2_response(f"Sorry, I couldn't find a booking with reference {booking_reference}.")

                item = response['Item']
                location = item.get('location', {}).get('S', 'Unknown')
                status = item.get('status', {}).get('S', 'Unknown')
                start_time = item.get('startTime', {}).get('S', 'Unknown')
                end_time = item.get('endTime', {}).get('S', 'Unknown')
                scooter_type = item.get('scooterType', {}).get('S', 'Unknown')

                message = (
                    f"Booking {booking_reference} is currently *{status}*. "
                    f"It was scheduled from {start_time} to {end_time} at {location} "
                    f"using a {scooter_type} scooter."
                )

                return format_v2_response(message)

            except Exception as e:
                print("Error fetching booking:", e)
                return format_v2_response("Sorry, there was an error retrieving your booking details. Please try again later.")

        # --- SUBMIT CONCERN INTENT ---
        elif intent_name == "SubmitConcernIntent":
            slots = event['sessionState']['intent']['slots']

            # Extract slot values safely
            has_booking = slots.get('HasBookingRef', {}).get('value', {}).get('interpretedValue', '').lower()
            booking_ref_slot = slots.get('bookingReference')
            concern_type_slot = slots.get('ConcernType')
            concern_description_slot = slots.get('ConcernDescription')

            # Check required slots
            if not concern_type_slot or not concern_description_slot:
                return format_v2_response("Please provide both the concern type and description.")

            concern_type = concern_type_slot.get('value', {}).get('interpretedValue')
            concern_description = concern_description_slot.get('value', {}).get('interpretedValue')

            if not concern_type or not concern_description:
                return format_v2_response("Please provide both the concern type and description.")

            # If user said "yes" to having a booking reference

            # Optional booking reference
            booking_reference = None
            if booking_ref_slot and booking_ref_slot.get('value'):
                booking_reference = booking_ref_slot['value'].get('interpretedValue')


            # Create concern ID and use session ID as user ID
            concern_id = str(uuid.uuid4())
            user_id = event['sessionId']

            # Build item for DynamoDB
            item = {
                'concernId': {'S': concern_id},
                'userId': {'S': user_id},
                'concernType': {'S': concern_type},
                'description': {'S': concern_description}
            }

            if booking_reference:
                item['bookingReference'] = {'S': booking_reference}

            # Put item into DynamoDB
            dynamodb.put_item(
                TableName=CONCERNS_TABLE,
                Item=item
            )

            # Build success message
            message = f"Thanks! Your concern about '{concern_type}' has been submitted."
            if booking_reference:
                message += f" We’ve also noted your booking reference '{booking_reference}'."

            return format_v2_response(message)

        # --- UNHANDLED INTENT ---
        else:
            return format_v2_response("Intent not handled by this Lambda.")

    except Exception as e:
        return format_v2_response(f"Something went wrong: {str(e)}")


# Standard Lex V2 response format
def format_v2_response(message):
    return {
        "sessionState": {
            "dialogAction": {
                "type": "Close"
            },
            "intent": {
                "name": "FallbackIntent",
                "state": "Fulfilled"
            }
        },
        "messages": [
            {
                "contentType": "PlainText",
                "content": message
            }
        ]
    }
