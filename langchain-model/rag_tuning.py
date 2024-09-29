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

import json


class Model:
    def __init__(self, transcript):
        self.transcript=transcript
        self.llm = Ollama(model="llama3.1:8b")
        self.output_parser = StrOutputParser()
    
    def extract_patient_info(self):
        with open("./prompts/patient_info_prompt.txt", "r") as f:
            patient_info_instructions = f.read()

        patient_info_template = ChatPromptTemplate.from_template("""
            {instructions}
            {transcript}
        """)
        patient_info_chain = patient_info_template | self.llm | self.output_parser
        output = patient_info_chain.invoke({
            'instructions': patient_info_instructions,
            'transcript': self.transcript
        })
        #trim the output
        output = output[output.find("{"):output.rfind("}")+1]
        print(output)

        try:
            patient_info = json.loads(output)
        except json.JSONDecodeError:
            # Handle parsing error
            print("Error parsing JSON output.")
            patient_info = {}

        return patient_info

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
with open("test1.txt", "r") as f:
    transcript = f.read()

my_model = Model(transcript)

print(my_model.extract_patient_info())
exit(0)
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

