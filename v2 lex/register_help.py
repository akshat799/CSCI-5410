import json
import boto3
import uuid
import os

dynamodb = boto3.client('dynamodb')
sns = boto3.client('sns')

BOOKINGS_TABLE = "Bookings"
CONCERNS_TABLE = "Concerns"
CONCERN_TOPIC_ARN = os.environ['CONCERN_TOPIC_ARN']

def lambda_handler(event, context):
    try:
        print(event)
        intent_name = event['sessionState']['intent']['name']
        session_attrs = event['sessionState'].get('sessionAttributes', {}) or {}
        user_role = session_attrs.get('role', 'Guest')
        user_id = session_attrs.get('email', 'Guest')

        # --- REGISTER HELP INTENT (open to all) ---
        if intent_name == "RegisterHelpIntent":
            return format_v2_response(
                "To register, visit http://react-lb-674518411.us-east-1.elb.amazonaws.com/register   To log in, go to http://react-lb-674518411.us-east-1.elb.amazonaws.com/login",
                intent_name
            )

        # --- FIND BOOKING INTENT ---
        elif intent_name == "FindBookingIntent":
            if user_role not in ["RegisteredCustomer", "FranchiseOperator"]:
                return format_v2_response(
                    "You must be logged in as a Registered Customer or Franchise Operator to view bookings.",
                    intent_name
                )

            slots = event['sessionState']['intent']['slots']
            booking_slot = slots.get('bookingReference')

            if not booking_slot or not booking_slot.get('value'):
                return format_v2_response("Please provide your booking reference code.", intent_name)

            booking_reference = booking_slot['value']['interpretedValue'].upper()

            try:
                response = dynamodb.get_item(
                    TableName=BOOKINGS_TABLE,
                    Key={'bookingReference': {'S': booking_reference}}
                )

                if 'Item' not in response:
                    return format_v2_response(f"Sorry, I couldn't find a booking with reference {booking_reference}.", intent_name)

                item = response['Item']
                location = item.get('location', {}).get('S', 'Unknown')
                status = item.get('status', {}).get('S', 'Unknown')
                start_time = item.get('startTime', {}).get('S', 'Unknown')
                end_time = item.get('endTime', {}).get('S', 'Unknown')
                scooter_type = item.get('scooterType', {}).get('S', 'Unknown')

                if user_role == "FranchiseOperator":
                    message = (
                        f"Booking {booking_reference}: Scooter type: {scooter_type}, "
                        f"Location: {location}, Duration: {start_time} to {end_time}."
                    )
                else:  # RegisteredCustomer
                    message = (
                        f"Booking {booking_reference} is currently *{status}*. "
                        f"Scheduled from {start_time} to {end_time} at {location}."
                    )

                return format_v2_response(message, intent_name)

            except Exception as e:
                print("Error fetching booking:", e)
                return format_v2_response("Sorry, there was an error retrieving your booking details. Please try again later.", intent_name)

        # --- SUBMIT CONCERN INTENT ---
        elif intent_name == "SubmitConcernIntent":
            if user_role != "RegisteredCustomer":
                return format_v2_response("Only registered customers can submit concerns. Please log in.", intent_name)

            slots = event['sessionState']['intent']['slots']
            has_booking = slots.get('HasBookingRef', {}).get('value', {}).get('interpretedValue', '').lower()
            booking_ref_slot = slots.get('bookingReference')
            concern_type_slot = slots.get('ConcernType')
            concern_description_slot = slots.get('ConcernDescription')

            if not concern_type_slot or not concern_description_slot:
                return format_v2_response("Please provide both the concern type and description.", intent_name)

            concern_type = concern_type_slot.get('value', {}).get('interpretedValue')
            concern_description = concern_description_slot.get('value', {}).get('interpretedValue')

            if not concern_type or not concern_description:
                return format_v2_response("Please provide both the concern type and description.", intent_name)

            booking_reference = None
            if booking_ref_slot and booking_ref_slot.get('value'):
                booking_reference = booking_ref_slot['value'].get('interpretedValue')
                if booking_reference.lower() == "skip":
                    booking_reference = None

            concern_id = str(uuid.uuid4())

            item = {
                'concernId': {'S': concern_id},
                'userId': {'S': user_id},
                'concernType': {'S': concern_type},
                'description': {'S': concern_description}
            }

            if booking_reference:
                item['bookingReference'] = {'S': booking_reference}

            dynamodb.put_item(TableName=CONCERNS_TABLE, Item=item)

            sns.publish(
                TopicArn=CONCERN_TOPIC_ARN,
                Subject="New Customer Concern",
                Message=json.dumps({
                    "concernId": concern_id,
                    "userId": user_id,
                    "concernType": concern_type,
                    "description": concern_description,
                    "bookingReference": booking_reference or "N/A"
                })
            )

            message = f"Thanks! Your concern about '{concern_type}' has been submitted."
            if booking_reference:
                message += f" Booking reference: '{booking_reference}'."

            return format_v2_response(message, intent_name)

        # --- UNKNOWN INTENT ---
        else:
            return format_v2_response("Intent not handled by this Lambda.", intent_name)

    except Exception as e:
        return format_v2_response(f"Something went wrong: {str(e)}", "FallbackIntent")


# Updated helper: includes intent name
def format_v2_response(message, intent_name):
    return {
        "sessionState": {
            "dialogAction": {
                "type": "Close"
            },
            "intent": {
                "name": intent_name,
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
