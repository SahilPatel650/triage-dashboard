from langchain_community.llms import Ollama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnablePassthrough
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS

class Model:
    def __init__(self, pdf_name, llm):
        with open(f"./tests/{pdf_name}.txt", "r") as f:
            self.transcript = f.read()

        self.llm=llm

        self.output_parser = StrOutputParser()

    # Get the location of the person
    def extract_location(self):
        with open("./prompts/location_prompt.txt", "r") as f:
            location_instruction = f.read()

        location_template = ChatPromptTemplate.from_template("""
                {instructions}
                {transcript}
                """)

        location_chain = location_template|self.llm|self.output_parser

        self.location = location_chain.invoke({'instructions': location_instruction, 'transcript': self.transcript})
        return self.location
    
    def call_llm(self, prompt):
        return self.llm.invoke(prompt)

    # Get the symptoms of the person
    def extract_symptoms(self):
        with open("./prompts/symptoms_prompt.txt", "r") as f:
            symptom_instruction = f.read()

        symptom_template = ChatPromptTemplate.from_template("""
                {instructions}
                {transcript}
                """)

        symptom_chain = symptom_template|self.llm|self.output_parser

        self.symptoms = symptom_chain.invoke({'instructions': symptom_instruction, 'transcript': self.transcript})
        return self.symptoms

    # Get the name of the person
    def extract_name(self):
        with open("./prompts/name_prompt.txt") as f:
            name_instructions = f.read()

        name_template = ChatPromptTemplate.from_template("""
            {instructions}
            {transcript}
            """)
        name_chain = name_template|self.llm|self.output_parser
        self.name = name_chain.invoke({'instructions': name_instructions, 'transcript': self.transcript})

        return self.name

    # Summarize any other important things that the user says
    def extract_notes(self):
        with open("./prompts/notes_prompt.txt") as f:
            notes_instructions = f.read()

        notes_template = ChatPromptTemplate.from_template("""
            {instructions}
            {transcript}
            """)
        notes_chain = notes_template|self.llm|self.output_parser
        self.notes = notes_chain.invoke({'instructions': notes_instructions, 'transcript': self.transcript})

        return self.notes

    def create_db(self):
        loader = PyPDFLoader("./resources/S2D.pdf")
        pdf_docs = loader.load()
        print("loaded")
        self.db = FAISS.from_documents(pdf_docs, OllamaEmbeddings(model="llama3:latest"))
        self.db.save_local("faiss_index")
        print(self.db)