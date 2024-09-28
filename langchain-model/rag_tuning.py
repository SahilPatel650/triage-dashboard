import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from langchain_community.llms import Ollama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnablePassthrough
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter


class Model:
    def __init__(self):
        with open("test3.txt", "r") as f:
            self.transcript = f.read()

        self.llm = Ollama(model="llama3.1:8b")
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

    # [Extracting methods remain unchanged]

    def create_db(self, pdf_path, index_name, model_name):
        loader = PyPDFLoader(pdf_path)
        pdf_docs = loader.load()
        print(f"Loaded {index_name}")

        # Split the documents into smaller chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        documents = text_splitter.split_documents(pdf_docs)
        print(f"Documents split into {len(documents)} chunks.")

        # Use a better embeddings model
        embeddings = HuggingFaceEmbeddings(model_name=model_name)

        # Create the vector store
        self.db = FAISS.from_documents(documents, embeddings)
        self.db.save_local(f"index/{index_name}")
        print("Vector store created and saved.")


def runvector(index_name, model_name):
    # Load the vector store with the same embeddings
    embeddings = HuggingFaceEmbeddings(model_name=model_name)
    # embeddings = HuggingFaceEmbeddings(model_name="neuml/pubmedbert-base-embeddings")

    new_vector_store = FAISS.load_local(f"index/{index_name}", embeddings, allow_dangerous_deserialization=True)

    # Perform similarity search with the improved embeddings
    query = my_model.extract_symptoms()
    print("Query:", query)
    docs = new_vector_store.similarity_search(query, k=5)

    # Concatenate the retrieved documents
    context = "\n\n".join([doc.page_content for doc in docs])
    # print("Retrieved Context:", context)

    # Formulate the prompt with the retrieved context
    prompt = f"{query}. Based on the following context, provide a diagnosis, treatment options, and TRIAGE LEVEL:\n\n{context}"

    # Generate the response using the LLM
    llm_response = Ollama(model="llama3.1:8b").invoke(prompt)
    print("LLM Response:", llm_response)

# Initialize the model and create the vector store
my_model = Model()
print()

# Define the different options for the variables
options = [
    {
        "model_name": "sentence-transformers/all-MiniLM-L6-v2",
        "pdf_path": "./resources/oxford.pdf",
        "index_name": "oxford_v1"
    },
    {
        "model_name": "neuml/pubmedbert-base-embeddings",
        "pdf_path": "./resources/oxford.pdf",
        "index_name": "oxford_med_embed"
    }
    
]

# Select the option you want to use
selected_option = options[0]  # Change the index to select a different option

# Assign the selected option to the variables
model_name = selected_option["model_name"]
pdf_path = selected_option["pdf_path"]
index_name = selected_option["index_name"]


# my_model.create_db(pdf_path, index_name, model_name)



runvector(index_name, model_name)
print("\n\n")

