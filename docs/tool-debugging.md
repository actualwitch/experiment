# Tool Use Debugging

Experiment provides comprehensive visualization capabilities for LLM tool interactions. While it doesn't execute tools directly, it offers powerful debugging features to help you understand and refine tool schemas and completions.

## Adding Tools

1. Copy a JSON schema for your tool
2. Paste it into the chat input
3. Tools in supported formats are automagically added to chat

## Visualization Features

- **Structured Display**: Tools are visualized in a convenient form with all properties sorted first by name, then by depth
- **Interactive Navigation**: Click on property names to collapse sections for better readability
- **Multiple Tool Support**: Add multiple tools to a conversation and they'll all be available to the model
- **Completion Visualization**: Tool use completions from the model are also visualized in a similar manner

## Example Workflow

1. Create a new experiment
2. Add your system prompt as a "system" message
3. Add your tool schema as a "tool" message
4. Add your user query as a "user" message
5. Run the experiment with your chosen model
6. Examine the tool use in the model's response with the interactive visualization

This workflow makes it easy to iterate on tool designs and understand how models interact with your tools.