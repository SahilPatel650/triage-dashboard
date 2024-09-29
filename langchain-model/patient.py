class Patient:
    def __init__(self, id):
        self.id = id
        self.name = None
        self.call_summary = None
        self.time_received = None
        self.triage = None
        self.symptoms = None
        self.meds = []
        self.rooms = []
        self.procedures = []

    def __str__(self):
        return f"Patient(id={self.id}, name={self.name}, call_summary={self.call_summary}, time_received={self.time_received}, triage={self.triage}, symptoms={self.symptoms}, meds={self.meds}, rooms={self.rooms}, procedures={self.procedures})"
    
class PatientList:
    def __init__(self):
        self.patients = {}

    def add_patient(self, patient):
        self.patients[patient.id] = patient

    def get_patient_by_id(self, id):
        return self.patients.get(id, None)

    def as_dict(self):
        return self.patients

    def as_list(self):
        return {patient.id: patient for patient in self.patients}