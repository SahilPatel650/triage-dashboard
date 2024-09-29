curl -X POST http://localhost:5100/delete_all_patients

curl -X POST http://localhost:5100/add_patient -H "Content-Type: application/json" -d '{"id": "a", "summary": "chest pain, numbness in arm, shortness of breath. likely cardiac arrest", "name": "Sahil Patel", "time": "2024-09-28T23:00:00.000Z", "symptoms": "chest pain, breathing difficulty, arm numb", "triage": 1, "meds": ["aspirin", "oxygen"], "procedures": ["ECG", "resuscitation"], "rooms": ["Operating Room"], "age": 52}'

curl -X POST http://localhost:5100/add_patient -H "Content-Type: application/json" -d '{"id": "b", "summary": "patient fell off bike, fractured forearm", "name": "Mrinal Jain", "time": "2024-09-28T23:00:00.000Z", "symptoms": "sharp pain in arm, swelling in arm", "triage": 3, "meds": ["painkillers", "ibuprofen"], "procedures": ["X-Ray", "Plaster"], "rooms": ["X-Ray"], "age": 19, "gender": "M"}'

curl -X POST http://localhost:5100/add_patient -H "Content-Type: application/json" -d '{"id": "c", "summary": "patient is alone, possible appendicitis", "name": "Shreyas Basa", "time": "2024-09-28T23:00:00.000Z", "symptoms": "abdomen pain, nausea", "triage": 2, "meds": ["penicillin", "painkiller"], "procedures": ["appendectomy", "CT Scan"], "rooms": ["Operating Room", "CT Scan"]}'
