from flask import Flask, request, Response, jsonify
from twilio.twiml.voice_response import VoiceResponse, Dial
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
import whisper

load_dotenv()

# Twilio Credentials and Configurations
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
FORWARD_TO_PHONE_NUMBER = os.getenv("FORWARD_TO_PHONE_NUMBER")

# Initialize Twilio client
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Flask app initialization
app = Flask(__name__)

# Enable CORS for localhost:3000
CORS(app, origins=["http://localhost:3000"])

# Request Validator for validating Twilio requests
validator = RequestValidator(TWILIO_AUTH_TOKEN)

whisper_model = whisper.load_model("base")

patients = [{"name": "John Doe", "id": "1", "room": 101}]
rooms = [{"roomName": f"Bed {i}", "patients": []} for i in range(1, 5)]
rooms.extend(
    [
        {"roomName": "X-Ray", "patients": []},
        {"roomName": "MRI", "patients": []},
        {"roomName": "CT Scan", "patients": []},
        {"roomName": "Blood Test", "patients": []},
        {"roomName": "Operating Theatre", "patients": []},
    ]
)


@app.route("/")
def index():
    """Simple landing page."""
    return "Twilio Call Forwarding Example"


@app.route("/incoming_call", methods=["POST"])
def incoming_call():
    """Handle incoming calls and forward to operator."""
    # Validate Twilio request
    url = request.url
    twilio_signature = request.headers.get("X-Twilio-Signature", "")
    post_vars = request.form.to_dict()

    if not validator.validate(url, post_vars, twilio_signature):
        print("Invalid request :(.")

    response = VoiceResponse()

    call_id = request.form["CallSid"]
    # print(call_id)

    # Say a message to the caller
    response.say("Connecting you to the operator.")

    # Forward the call to the operator using the Dial verb
    dial = Dial(
        record="record-from-answer-dual",
        recording_status_callback=f"/save_recording/{call_id}",
        recording_status_callback_event="completed",
        recording_status_callback_method="POST",
    )
    dial.number(FORWARD_TO_PHONE_NUMBER)  # Forward to the operator

    response.append(dial)

    return Response(str(response), 200, mimetype="application/xml")


@app.route("/save_recording/<call_id>", methods=["POST"])
def save_recording(call_id):
    """Save the call recording."""
    recording_url = request.form["RecordingUrl"]
    try:
        recording = requests.get(
            recording_url, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        )
        recording.raise_for_status()  # Raise an HTTPError for bad responses
        with open(f"audio_records/{call_id}.mp3", "wb") as f:
            f.write(recording.content)
    except requests.exceptions.RequestException as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    return jsonify({"status": "success"})


@app.route("/transcribe/<call_id>", methods=["POST"])
def transcribe(call_id):
    """Transcribe the call recording (simulated for now)."""
    audio_file = f"audio_records/{call_id}.mp3"

    # Ensure the file exists before proceeding
    if not os.path.exists(audio_file):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"No recording found for call ID {call_id}.",
                }
            ),
            404,
        )

    # Simulate transcription processing
    # In reality, you can implement Whisper or another transcription engine
    transcription = "Simulated transcription for call: " + call_id

    return jsonify({"status": "success", "transcription": transcription})


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})


@app.route("/add_patient", methods=["POST"])
def add_patient():
    data = request.json
    patients.append(data)
    return jsonify({"status": "success"})


@app.route("/get_patients", methods=["GET"])
def get_patients():
    return jsonify(patients)


@app.route("/edit_patient/<p_id>", methods=["POST"])
def edit_patient(p_id):
    data = request.json
    for patient in patients:
        if patient["id"] == p_id:
            patient.update(data)
            return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Patient not found"})


@app.route("/delete_patient/<p_id>", methods=["POST"])
def delete_patient(p_id):
    for patient in patients:
        if patient["id"] == p_id:
            patients.remove(patient)
            return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Patient not found"})


if __name__ == "__main__":
    app.run(host="localhost", port=5100, debug=True)
