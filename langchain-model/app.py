import asyncio
from flask import Flask, request, Response, jsonify
from twilio.twiml.voice_response import VoiceResponse, Dial
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from flask_cors import CORS, cross_origin
import os
import requests
from dotenv import load_dotenv
import whisper
from pydub import AudioSegment
from test import Model

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
CORS(app)


# Request Validator for validating Twilio requests
validator = RequestValidator(TWILIO_AUTH_TOKEN)

whisper_model = whisper.load_model("base") 

patients = [
    # {
    #     "name": "K Bhal",
    #     "callSummary": "Patient is experiencing chest pain and shortness of breath.",
    #     "time": "2024-09-28T23:20:00.000Z",
    #     "id": "abc",
    #     "symptoms": ["chest pain", "shortness of breath"],
    #     "triage": "urgent",
    #     "meds": ["aspirin", "nitroglycerin", "oxygen"],
    #     "procedures": ["ECG", "blood test"],
    #     "bed": -1,
    #     "rooms": ["Blood Test", "Operating Room"],
    # }
]
beds = ["" for _ in range(6)]
rooms = [
    {"roomName": "X-Ray", "patients": []},
    {"roomName": "MRI", "patients": []},
    {"roomName": "CT Scan", "patients": []},
    {"roomName": "Blood Test", "patients": []},
    {"roomName": "Operating Room", "patients": []},
]

async def process_transcription(audio_file_path, call_id):
    # Load and split the stereo audio
    audio = AudioSegment.from_file(audio_file_path)
    caller_channel = audio.split_to_mono()[0]  # Left channel (caller)
    dispatcher_channel = audio.split_to_mono()[1]  # Right channel (dispatcher)

    # Save channels as temporary files
    caller_audio_path = f"audio_records/{call_id}_caller.wav"
    dispatcher_audio_path = f"audio_records/{call_id}_dispatcher.wav"
    caller_channel.export(caller_audio_path, format="wav")
    dispatcher_channel.export(dispatcher_audio_path, format="wav")

    # Transcribe both channels
    caller_result = whisper_model.transcribe(caller_audio_path, verbose=True)
    dispatcher_result = whisper_model.transcribe(dispatcher_audio_path, verbose=True)

    # Prepare to merge transcripts
    transcription = []
    
    for segment in caller_result['segments']:
        transcription.append({
            "start": segment['start'],
            "end": segment['end'],
            "speaker": "Caller",
            "text": segment['text']
        })
    
    for segment in dispatcher_result['segments']:
        transcription.append({
            "start": segment['start'],
            "end": segment['end'],
            "speaker": "Dispatcher",
            "text": segment['text']
        })

    # Sort by timestamps
    transcription = sorted(transcription, key=lambda x: x['start'])

    # Merge consecutive lines from the same speaker
    merged_transcription = []
    for entry in transcription:
        if merged_transcription and merged_transcription[-1]['speaker'] == entry['speaker']:
            merged_transcription[-1]['text'] += " " + entry['text']
            merged_transcription[-1]['end'] = entry['end']
        else:
            merged_transcription.append(entry)

    # Output transcription (you can save it, send it somewhere, or return it)
    with open(f"transcriptions/{call_id}_transcription.txt", "w") as f:
        for entry in merged_transcription:
            f.write(f"{entry['speaker']}: {entry['text']}\n")

    print(f"[Whisper] Transcription for call {call_id} completed and saved.")

    # Send transcription to RAG model or further processing
    await asyncio.gather(send_to_rag_model(merged_transcription, call_id), create_summary_for_doctor(merged_transcription, call_id))


async def send_to_rag_model(transcription, call_id):
    # Placeholder function to call the RAG model
    my_model = Model(transcription, call_id)
    try:
        data = my_model.extract_patient_info()
    except Exception as e:
        print(f"Error extracting patient info: {e}")
        return jsonify({"status": "error", "message": str(e)})

    #update patient info
    for patient in patients:
        if patient["id"] == call_id:
            patient.update(data)
            return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Patient not found"})

    

async def create_summary_for_doctor(transcription, call_id):
    # Placeholder function to generate summary for doctors
    print(f"[Summary] Creating summary for call {call_id}") 
    # Summary generation logic here

@app.route("/incoming_call", methods=["POST"])
def incoming_call():
    """Handle incoming calls and forward to operator."""
    # Validate Twilio request
    # url = request.url
    # twilio_signature = request.headers.get('X-Twilio-Signature', '')
    # post_vars = request.form.to_dict()

    # if not validator.validate(url, post_vars, twilio_signature):
    #     print("Invalid request :(.")
    print(f"[Twilio] Incoming call received from {request.form['CallSid']}.")

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
        recording = requests.get(recording_url, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))
        recording.raise_for_status()  
        with open(f"audio_records/{call_id}.mp3", "wb") as f:
            f.write(recording.content)
    except requests.exceptions.RequestException as e:
        print(f"[Twilio] Error saving recording for {call_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    
    print(f"[Twilio] Recording saved for call {call_id}.")
    asyncio.run(process_transcription(f"audio_records/{call_id}.mp3", call_id))
    
    return jsonify({"status": "success"})


@app.route('/test-transcribe', methods=['POST'])
def transcribe():
    #to be used as a testing endpoint where we provide pre-recorded audio files
    audio_file_path = "audio_records/test.mp3"
    asyncio.run(process_transcription(audio_file_path, "test"))
    return jsonify({"status": "success"})


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})


def id2triage(id):
    for i in range(len(patients)):
        if patients[i]["id"] == id:
            return patients[i]["triage"]
    raise ValueError("Patient not found")


def add_to_room(patient, queue):
    if len(queue) <= 1:
        queue.append(patient["id"])
        return
    for q_patient_idx in range(len(queue) - 1, 0, -1):
        q_patient_triage = id2triage(queue[q_patient_idx])
        if patient["triage"] >= q_patient_triage:
            queue.insert(q_patient_idx + 1, patient["id"])
            return
    queue.insert(1, patient["id"])


@app.route("/add_patient", methods=["POST"])
@cross_origin()
def add_patient():
    data = request.json
    for room in data["rooms"]:
        for i in range(len(rooms)):
            if rooms[i]["roomName"] == room:
                add_to_room(data, rooms[i]["patients"])
    patients.append(data)
    return jsonify({"status": "success"})


@app.route("/get_patients", methods=["GET"])
@cross_origin()
def get_patients():
    return jsonify(patients)


@app.route("/get_rooms", methods=["GET"])
@cross_origin()
def get_rooms():
    return jsonify(rooms)


@app.route("/get_beds", methods=["GET"])
@cross_origin()
def get_beds():
    return jsonify(beds)


@app.route("/set_beds", methods=["POST"])
@cross_origin()
def set_beds():
    global beds
    beds = request.json
    return jsonify({"status": "success"})


@app.route("/pop_from_room/<room_name>", methods=["POST"])
@cross_origin()
def pop_from_room(room_name):
    for room in rooms:
        if room["roomName"] == room_name:
            if len(room["patients"]) == 0:
                return jsonify({"status": "error", "message": "Room is empty"})
            patient_id = room["patients"].pop(0)
            for patient in patients:
                if patient["id"] == patient_id:
                    for room in patient["rooms"]:
                        if room == room_name:
                            patient["rooms"].remove(room)
                            break
                    return jsonify(patient)
    return jsonify({"status": "error", "message": "Room not found"})


@app.route("/edit_patient/<p_id>", methods=["POST"])
@cross_origin()
def edit_patient(p_id):
    data = request.json
    for patient in patients:
        if patient["id"] == p_id:
            patient.update(data)
            return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Patient not found"})


@app.route("/delete_patient/<p_id>", methods=["POST"])
@cross_origin()
def delete_patient(p_id):
    for patient in patients:
        if patient["id"] == p_id:
            for i in range(len(beds)):
                if beds[i] == p_id:
                    beds[i] = ""
                    break
            for room in patient["rooms"]:
                for i in range(len(rooms)):
                    if rooms[i]["roomName"] == room:
                        rooms[i]["patients"].remove(p_id)
                        break
            patients.remove(patient)
            return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Patient not found"})


@app.after_request
def add_header(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

# Replace with your actual Google Maps API key
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

# Emory Hospital Midtown coordinates
EMORY_HOSPITAL_COORDS = (33.7875, -84.3878)  # Latitude and Longitude for Emory Hospital Midtown

@app.route('/distance_to_emory', methods=['GET'])
def distance_to_emory():
    address = request.args.get('address')

    if not address:
        return jsonify({'error': 'No address provided'}), 400

    # Get the coordinates of the provided address
    geocode_url = f'https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_MAPS_API_KEY}'
    geocode_response = requests.get(geocode_url)
    geocode_data = geocode_response.json()

    if geocode_data['status'] != 'OK':
        return jsonify({'error': 'Invalid address'}), 400

    # Extract the coordinates of the address
    location = geocode_data['results'][0]['geometry']['location']
    latitude = location['lat']
    longitude = location['lng']

    # Calculate the distance to Emory Hospital Midtown
    distance_url = f'https://maps.googleapis.com/maps/api/distancematrix/json?origins={latitude},{longitude}&destinations={EMORY_HOSPITAL_COORDS[0]},{EMORY_HOSPITAL_COORDS[1]}&key={GOOGLE_MAPS_API_KEY}'
    distance_response = requests.get(distance_url)
    distance_data = distance_response.json()

    if distance_data['status'] != 'OK':
        return jsonify({'error': 'Could not calculate distance'}), 500

    # Extract the distance information
    distance_text = distance_data['rows'][0]['elements'][0]['distance']['text']
    duration_text = distance_data['rows'][0]['elements'][0]['duration']['text']

    return jsonify({
        'destination': 'Emory Hospital Midtown',
        'distance': distance_text,
        'duration': duration_text
    })


if __name__ == "__main__":
    app.run(host="localhost", port=5100, debug=True)
