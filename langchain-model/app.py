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
from datetime import datetime, timedelta
from pydub import AudioSegment
from Model import Model
import threading

load_dotenv()

# Twilio Credentials and Configurations
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
FORWARD_TO_PHONE_NUMBER = os.getenv("FORWARD_TO_PHONE_NUMBER")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


# LangSmith Tracking
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")


# Initialize Twilio client
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Flask app initialization
app = Flask(__name__)

# Enable CORS for localhost:3000
CORS(app)


# Request Validator for validating Twilio requests
validator = RequestValidator(TWILIO_AUTH_TOKEN)

# make audio_records and transcriptions directories
os.makedirs("audio_records", exist_ok=True)
os.makedirs("transcriptions", exist_ok=True)

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
rooms = list(
    map(
        lambda x: {"name": x, "patientQueue": []},
        ["X-Ray", "MRI", "CT Scan", "Blood Test", "Operating Room"],
    )
)


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
    caller_result = whisper_model.transcribe(caller_audio_path, verbose=False)
    dispatcher_result = whisper_model.transcribe(dispatcher_audio_path, verbose=False)

    # Prepare to merge transcripts
    transcription = []

    for segment in caller_result["segments"]:
        transcription.append(
            {
                "start": segment["start"],
                "end": segment["end"],
                "speaker": "Caller",
                "text": segment["text"],
            }
        )

    for segment in dispatcher_result["segments"]:
        transcription.append(
            {
                "start": segment["start"],
                "end": segment["end"],
                "speaker": "Dispatcher",
                "text": segment["text"],
            }
        )

    # Sort by timestamps
    transcription = sorted(transcription, key=lambda x: x["start"])

    # Merge consecutive lines from the same speaker
    merged_transcription = []
    for entry in transcription:
        if (
            merged_transcription
            and merged_transcription[-1]["speaker"] == entry["speaker"]
        ):
            merged_transcription[-1]["text"] += " " + entry["text"]
            merged_transcription[-1]["end"] = entry["end"]
        else:
            merged_transcription.append(entry)

    # Save the merged transcription to a file
    with open(f"transcriptions/{call_id}_transcription.txt", "w") as f:
        for entry in merged_transcription:
            f.write(f"{entry['speaker']}: {entry['text']}\n")

    # make merged transcription a single string
    merged_transcription_text = ""
    for entry in merged_transcription:
        merged_transcription_text += f"{entry['speaker']}: {entry['text']}\n"

    print(f"[Whisper] Transcription for call {call_id} completed and saved.")

    # Send transcription to RAG model or further processing
    send_to_model(merged_transcription_text, call_id)


def send_to_model(transcription, call_id):
    # Placeholder function to call the RAG model
    print(f"[Ollama] Transcription for call {call_id} sent to model.")
    my_model = Model(transcript=transcription, id=call_id)
    
    # Initialize a variable to hold patient data
    patient_data = {"id": call_id}
    
    # Extract patient info from the model
    patient_info = my_model.extract_patient_info()
    
    if patient_info:
        try:
            print(f"[Ollama] Calculating distance from {patient_info['address']}.")
            time = distance_to_emory(patient_info["address"])
            print(time)

            patient_info["time"] = time
        except Exception as e:
            print(f"[Ollama] Error calculating distance: {e}")
            return

        # Update patient data with the extracted patient info
        patient_data.update(patient_info)
        print(f"[Ollama] Patient info extracted for call {call_id}.")
    else:
        print(f"[Ollama] Error extracting patient info for call {call_id}.")
        return
    
    print(f"[RAG] Sending transcription for call {call_id} to RAG.")
    diagnosis_info = my_model.runvector()

    if diagnosis_info:
        print(diagnosis_info)

        # Update patient data with the diagnosis info
        patient_data.update(diagnosis_info)
        print(f"[RAG] Diagnosis info extracted for call {call_id}.")
    else:
        print(f"[RAG] Error extracting diagnosis info for call {call_id}.")
        return

    # Add the patient data to the patients list
    patients.append(patient_data)
    print(f"[System] Patient data appended for call {call_id}.")


    


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
    # patients.append({"id": call_id})
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
        recording.raise_for_status()
        with open(f"audio_records/{call_id}.mp3", "wb") as f:
            f.write(recording.content)
    except requests.exceptions.RequestException as e:
        print(f"[Twilio] Error saving recording for {call_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

    print(f"[Twilio] Recording saved for call {call_id}.")
    def run_process_transcription():
        asyncio.run(process_transcription(f"audio_records/{call_id}.mp3", call_id))

    transcription_thread = threading.Thread(target=run_process_transcription)
    transcription_thread.start()


    return jsonify({"status": "success"})


@app.route("/test-transcribe", methods=["POST"])
def transcribe():
    # remove transcript if already exists
    if os.path.exists("transcriptions/test_transcription.txt"):
        os.remove("transcriptions/test_transcription.txt")
    #reset patients list
    # patients.clear()
    # patients.append({"id": "test"})
    #to be used as a testing endpoint where we provide pre-recorded audio files
    audio_file_path = "audio_records/CA48cba2a491b5f7fced132f48cec33c4f.mp3"
    asyncio.run(process_transcription(audio_file_path, "CA48cba2a491b5f7fced132f48cec33c4f"))
    return jsonify({"status": "success"})


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})


def id2triage(id):
    for i in range(len(patients)):
        if patients[i]["id"] == id:
            return patients[i]["triage"]
    raise ValueError("Patient not found")


def id2patient(id):
    for i in range(len(patients)):
        if patients[i]["id"] == id:
            return patients[i]
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


@app.route("/add_to_room/<room_name>/<p_id>", methods=["POST"])
@cross_origin()
def add_to_room_api(room_name, p_id):
    for i in range(len(rooms)):
        if rooms[i]["name"] == room_name:
            add_to_room(id2patient(p_id), rooms[i]["patientQueue"])
            return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Room not found"})


@app.route("/add_patient", methods=["POST"])
@cross_origin()
def add_patient():
    data = request.json
    # for room in data["rooms"]:
    #     for i in range(len(rooms)):
    #         if rooms[i]["name"] == room:
    #             add_to_room(data, rooms[i]["patientQueue"])
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
        if room["name"] == room_name:
            if len(room["patientQueue"]) == 0:
                return jsonify({"status": "error", "message": "Room is empty"})
            patient_id = room["patientQueue"].pop(0)
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
                    if rooms[i]["name"] == room:
                        rooms[i]["patientQueue"].remove(p_id)
                        break
            patients.remove(patient)
            return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Patient not found"})


@app.route("/delete_all_patients", methods=["POST"])
@cross_origin()
def delete_all_patients():
    patients.clear()
    global beds
    beds = ["" for _ in range(6)]
    global rooms
    rooms = list(
        map(
            lambda x: {"name": x, "patientQueue": []},
            ["X-Ray", "MRI", "CT Scan", "Blood Test", "Operating Room"],
        )
    )
    return jsonify({"status": "success"})


@app.after_request
def add_header(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


# Replace with your actual Google Maps API key

# Emory Hospital Midtown coordinates
EMORY_HOSPITAL_COORDS = (
    33.7875,
    -84.3878,
)  # Latitude and Longitude for Emory Hospital Midtown


def distance_to_emory(address):
    if not address:
        return jsonify({"error": "No address provided"}), 400

    # Get the coordinates of the provided address
    geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_MAPS_API_KEY}"
    geocode_response = requests.get(geocode_url)
    geocode_data = geocode_response.json()

    if geocode_data["status"] != "OK":
        print(f"[GMap API] Error geocoding address: {geocode_data['status']}")
        return None

    # Extract the coordinates of the address
    location = geocode_data["results"][0]["geometry"]["location"]
    latitude = location["lat"]
    longitude = location["lng"]

    # Calculate the distance to Emory Hospital Midtown
    distance_url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={latitude},{longitude}&destinations={EMORY_HOSPITAL_COORDS[0]},{EMORY_HOSPITAL_COORDS[1]}&key={GOOGLE_MAPS_API_KEY}"
    distance_response = requests.get(distance_url)
    distance_data = distance_response.json()

    if distance_data["status"] != "OK":
        print(f"[GMap API] Error calculating distance: {distance_data['status']}")
        return None

    # Extract the distance information
    distance_element = distance_data["rows"][0]["elements"][0]
    duration_value = distance_element["duration"]["value"]  # Duration in seconds

    # Calculate the arrival time
    current_time = datetime.now()
    arrival_time = current_time + timedelta(seconds=duration_value)
    arrival_time += timedelta(hours=4)
    timestring = arrival_time.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    return timestring


if __name__ == "__main__":
    app.run(host="localhost", port=5100, debug=True)
