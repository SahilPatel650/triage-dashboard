import Model

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

