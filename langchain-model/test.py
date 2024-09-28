import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# LangSmith Tracking
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")

from langchain_community.llms import Ollama
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnablePassthrough
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS

class Model:
    def __init__(self):
        with open("test3.txt", "r") as f:
            self.transcript = f.read()

        self.llm=Ollama(model="llama3")

        self.output_parser = StrOutputParser()

    # Get the location of the person
    def extract_location(self):
        with open("./prompts/location_prompt.txt", "r") as f:
            location_instruction = f.read()

        location_template = ChatPromptTemplate.from_template("""
                {instructions}
                {transcript}
                """)

        location_chain = location_template|llm|output_parser

        self.location = location_chain.invoke({'instructions': location_instruction, 'transcript': transcript})

    # Get the symptoms of the person
    def extract_symptoms(self):
        with open("./prompts/symptoms_prompt.txt", "r") as f:
            symptom_instruction = f.read()

        symptom_template = ChatPromptTemplate.from_template("""
                {instructions}
                {transcript}
                """)

        symptom_chain = symptom_template|llm|output_parser

        self.symptoms = symptom_chain.invoke({'instructions': symptom_instruction, 'transcript': transcript})

    # Get the name of the person
    def extract_name(self):
        with open("./prompts/name_prompt.txt") as f:
            name_instructions = f.read()

        name_template = ChatPromptTemplate.from_template("""
            {instructions}
            {transcript}
            """)
        name_chain = name_template|llm|output_parser
        self.name = name_chain.invoke({'instructions': name_instructions, 'transcript': transcript})

    # Summarize any other important things that the user says
    def extract_notes(self):
        with open("./prompts/notes_prompt.txt") as f:
            notes_instructions = f.read()

        notes_template = ChatPromptTemplate.from_template("""
            {instructions}
            {transcript}
            """)
        notes_chain = notes_template|llm|output_parser
        self.notes = notes_chain.invoke({'instructions': notes_instructions, 'transcript': transcript})

    
# TODO: Expand on the symptoms with other related terms - ex. my tummy hurts should be expanded to abdominal pain, stomach pain, etc.

# TODO: Query (RAG and/or google search) to get information about the expanded symptoms
    def create_db(self):
        loader = PyPDFLoader("./resources/S2D.pdf")
        pdf_docs = loader.load()
        self.db = FAISS.from_documents(pdf_docs, OllamaEmbeddings(model="llama3:latest"))
        print(self.db)
# TODO: Create a JSON object with all the information to send back to Flask

my_model = Model()
my_model.create_db()