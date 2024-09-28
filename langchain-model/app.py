import asyncio
from flask import Flask, request, Response, jsonify
from twilio.twiml.voice_response import VoiceResponse, Dial
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
import whisper
from pydub import AudioSegment

load_dotenv()

# Twilio Credentials and Configurations
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
FORWARD_TO_PHONE_NUMBER = os.getenv('FORWARD_TO_PHONE_NUMBER')

# Initialize Twilio client
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Flask app initialization
app = Flask(__name__)

# Enable CORS for localhost:3000
CORS(app, origins=["http://localhost:3000"])

# Request Validator for validating Twilio requests
validator = RequestValidator(TWILIO_AUTH_TOKEN)

whisper_model = whisper.load_model("base") 


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
    print(f"[RAG] Processing call {call_id} transcription: {transcription}")
    # Your RAG model processing here

async def create_summary_for_doctor(transcription, call_id):
    # Placeholder function to generate summary for doctors
    print(f"[Summary] Creating summary for call {call_id}") 
    # Summary generation logic here

@app.route('/incoming_call', methods=['POST'])
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

    call_id = request.form['CallSid']
    # print(call_id)

    # Say a message to the caller
    response.say("Connecting you to the operator.")

    # Forward the call to the operator using the Dial verb
    dial = Dial(record="record-from-answer-dual", recording_status_callback=f"/save_recording/{call_id}", recording_status_callback_event="completed", recording_status_callback_method="POST")
    dial.number(FORWARD_TO_PHONE_NUMBER)  # Forward to the operator

    response.append(dial)

    return Response(str(response), 200, mimetype="application/xml")


@app.route('/save_recording/<call_id>', methods=['POST'])
def save_recording(call_id):
    """Save the call recording."""
    recording_url = request.form['RecordingUrl']
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


@app.route("/health", methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})


if __name__ == '__main__':
    app.run(host='localhost', port=5100, debug=True)
