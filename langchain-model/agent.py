from langchain_community.tools import DuckDuckGoSearchRun
from langchain_community.llms import Ollama
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import tools_condition
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent, create_react_agent
from langchain import hub
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from test import Model
from langchain_core.tools import tool


import os
from dotenv import load_dotenv
load_dotenv()
os.environ["OPENAI_API_KEY"]=os.getenv("OPENAI_API_KEY")
[]
# LangSmith Tracking
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")


@tool
def runvector(query):
    """Search medical documents for information about conditions and relevant diagnosis."""
    # Load the vector store with the same embeddings
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    new_vector_store = FAISS.load_local("index/oxford_v1", embeddings, allow_dangerous_deserialization=True)

    # Perform similarity search with the improved embeddings
    #query = self.symptoms
    docs = new_vector_store.similarity_search(query, k=5)

    # Concatenate the retrieved documents
    context = "\n\n".join([doc.page_content for doc in docs])
    # print("Retrieved Context:", context)

    return context

    # Formulate the prompt with the retrieved context
    prompt = f"The patient is presenting with burn pain and redness. Based on the following context, provide a diagnosis, treatment options, and TRIAGE LEVEL:\n\n{context}"

    # Generate the response using the LLM
    llm_response = Ollama(model="llama3.1:8b").invoke(prompt)
    print("LLM Response:", llm_response)

class Agent:
    def __init__(self, model_name="llama3", transcript="test1"):
        self.llm=Ollama(model=model_name)
        
        # Uncomment for OpenAI Agent
        #self.llm=ChatOpenAI(model='gpt-4o')

        self.my_model = Model(transcript, self.llm)

        # define tools
        search = DuckDuckGoSearchRun()
        self.tools = [search, runvector]

        # Agent prompt
        with open("./prompts/agent_prompt.txt", "r") as f:
            self.agent_prompt = f.read()

        # Agent resources prompt
        with open("./prompts/agent_resources.txt", "r") as f:
            self.agent_resources_prompt = f.read()

    def extract_transcript_info(self):
        # Extract info from the transcript
        self.location = self.my_model.extract_location()
        self.symptoms = self.my_model.extract_symptoms()
        self.name = self.my_model.extract_name()
        self.notes = self.my_model.extract_notes()
        

    def ollama_agent(self) -> dict:
        instructions = "You are a helpful assistant for doctors and nurses. You are tasked with the very important job of using search on a set of input symptoms to suggest conditions the person may have, any necessary medications, operations, and diagnostic tests"
        base_prompt = hub.pull("langchain-ai/react-agent-template")
        prompt = base_prompt.partial(instructions=instructions)

        agent = create_react_agent(llm=self.llm, tools=self.tools, prompt=prompt)
        agent_executor = AgentExecutor(agent=agent, tools=self.tools, verbose=True)

        conditions = agent_executor.invoke(
            {"input": f"What are some conditions someone could have that is experiencing: {self.symptoms} \n {self.notes}? {self.agent_prompt}"},
            handle_parsing_errors=True
        )
        resources = agent_executor.invoke(
            {"input": f"{self.agent_resources_prompt} \n The patient is experiencing these symptoms: \n{self.symptoms} \n {self.notes}. \n The {self.agent_prompt}"},
            handle_parsing_errors=True
        )

        print("OLLAMA RESPONSE", res.keys())
        return res

    # BELOW works with OpenAI llm but not Ollama llm (uncomment in constructor)
    def openai_agent(self) -> list:
        if type(self.llm) != ChatOpenAI:
            print("You cannot run open_ai agent with Ollama llm, please switch llm in contructor")
            return

        llm_with_tools = self.llm.bind_tools(self.tools)

        sys_msg = SystemMessage(content="You are a helpful assistant for doctors and nurses. You are tasked with the very important job of using search on a set of input symptoms to suggest conditions the person may have, any necessary medications, operations, and diagnostic tests")

        # define nodes
        def reasoner(state: MessagesState):
            return {"messages": [llm_with_tools.invoke([sys_msg] + state["messages"])]}

        # Create graph
        builder = StateGraph(MessagesState)

        # Add nodes
        builder.add_node("reasoner", reasoner)
        builder.add_node("tools", ToolNode(self.tools))

        # Add edges
        builder.add_edge(START, "reasoner")
        builder.add_conditional_edges(
            "reasoner",
            # If latest message from reasoner node is tool call -> route to tools
            # if latest message from node reasoner is not a tool call -> route to the END
            tools_condition,
        )
        builder.add_edge("tools", "reasoner")
        react_graph = builder.compile()

        messages = [HumanMessage(content=f"What are some conditions someone could have that is experiencing: {self.symptoms} \n {self.notes}? {self.agent_prompt}")]
        messages = react_graph.invoke({'messages': messages})

        for m in messages['messages']:
            m.pretty_print()

        return messages
        #print(search.invoke("What are some conditions take someone could have with the following symptoms: burned, hurts so much, arm is red and blistered?"))



    def generate_patient_object():
        """"""
        pass


my_agent = Agent()
my_agent.extract_transcript_info()
my_agent.ollama_agent()