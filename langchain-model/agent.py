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


import os
from dotenv import load_dotenv
load_dotenv()
os.environ["OPENAI_API_KEY"]=os.getenv("OPENAI_API_KEY")

llm=Ollama(model="llama3")


# define tools
search = DuckDuckGoSearchRun()
tools = [search]

with open("./prompts/agent_prompt.txt", "r") as f:
    prompt_msg = f.read()

instructions = "You are a helpful assistant tasked with using search on a set of inputs"
base_prompt = hub.pull("langchain-ai/react-agent-template")
prompt = base_prompt.partial(instructions=instructions)

agent = create_react_agent(llm=llm, tools=tools, prompt=prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

res = agent_executor.invoke(
    {"input": prompt_msg}
)

#print(res)


# BELOW works with OpenAI but not Ollama

llm=ChatOpenAI(model='gpt-4o')
llm_with_tools = llm.bind_tools(tools)

sys_msg = SystemMessage(content="You are a helpful assistant tasked with using search on a set of inputs")


# define nodes
def reasoner(state: MessagesState):
    return {"messages": [llm_with_tools.invoke([sys_msg] + state["messages"])]}

# Create graph
builder = StateGraph(MessagesState)


# Add nodes
builder.add_node("reasoner", reasoner)
builder.add_node("tools", ToolNode(tools))

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

messages = [HumanMessage(content="Whare are some conditions someone could have with the following symptoms: burned, hurts so much, arm is red and blistered? After finding this information, find some medications that could solve that condition. If necessary list any further diagnostic tests needed to further assess the situation and any operations that must take place to treat the condition.")]
messages = react_graph.invoke({'messages': messages})

for m in messages['messages']:
    m.pretty_print()
#print(search.invoke("Whare are some conditions take someone could have with the following symptoms: burned, hurts so much, arm is red and blistered?"))