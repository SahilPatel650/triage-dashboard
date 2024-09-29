curl -X POST http://localhost:5100/delete_all_patients

curl -X POST http://localhost:5100/add_patient -H "Content-Type: application/json" -d '{"id": "a", "callSummary": "", "name": "Sahil Patel", "time": "2024-09-29T23:00:00.000Z", "symptoms": ["chest pain", "breathing difficulty"], "triage": 1, "meds": ["aspirin", "oxygen"], "procedures": ["ECG", "Blood Test"], "rooms": ["Operating Room"]}'

curl -X POST http://localhost:5100/add_patient -H "Content-Type: application/json" -d '{"id": "b", "callSummary": "", "name": "Kaustubh Bhal", "time": "2024-09-29T23:00:00.000Z", "symptoms": ["chest pain", "breathing difficulty"], "triage": 2, "meds": ["aspirin", "oxygen"], "procedures": ["ECG", "Blood Test"], "rooms": ["MRI"]}'

curl -X POST http://localhost:5100/add_patient -H "Content-Type: application/json" -d '{"id": "c", "callSummary": "", "name": "Mrinal Jain", "time": "2024-09-29T23:00:00.000Z", "symptoms": ["chest pain", "breathing difficulty"], "triage": 3, "meds": ["aspirin", "oxygen"], "procedures": ["ECG", "Blood Test"], "rooms": ["X-Ray"]}'

curl -X POST http://localhost:5100/add_patient -H "Content-Type: application/json" -d '{"id": "d", "callSummary": "", "name": "Shreyas Basa", "time": "2024-09-29T23:00:00.000Z", "symptoms": ["chest pain", "breathing difficulty"], "triage": 4, "meds": ["aspirin", "oxygen"], "procedures": ["ECG", "Blood Test"], "rooms": ["Operating Room"]}'
