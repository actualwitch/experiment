# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "torch",
#     "mlx-lm",
# ]
# ///
import argparse
import json
import sys
from mlx_lm import load, stream_generate
from mlx_lm.models.cache import make_prompt_cache
from mlx_lm.sample_utils import make_sampler


def send(type, additional={}):
    sys.stdout.write(json.dumps({"type": type, **additional}))
    sys.stdout.flush()


def get_tokenizer_config(model):
    if model == "mlx-community/Mistral-Large-Instruct-2407-4bit":
        return {
            # there seems to be no chat template included in config for this model, so here's mistral small 3 one instead
            "chat_template": "{%- set today = strftime_now(\"%Y-%m-%d\") %}\n{%- set default_system_message = \"You are Mistral Large 2, a Large Language Model (LLM) created by Mistral AI, a French startup headquartered in Paris.\\nYour knowledge base was last updated on 2023-10-01. The current date is \" + today + \".\\n\\nWhen you're not sure about some information, you say that you don't have the information and don't make up anything.\\nIf the user's question is not clear, ambiguous, or does not provide enough context for you to accurately answer the question, you do not try to answer it right away and you rather ask the user to clarify their request (e.g. \\\"What are some good restaurants around me?\\\" => \\\"Where are you?\\\" or \\\"When is the next flight to Tokyo\\\" => \\\"Where do you travel from?\\\")\" %}\n\n{{- bos_token }}\n\n{%- if messages[0]['role'] == 'system' %}\n    {%- set system_message = messages[0]['content'] %}\n    {%- set loop_messages = messages[1:] %}\n{%- else %}\n    {%- set system_message = default_system_message %}\n    {%- set loop_messages = messages %}\n{%- endif %}\n{{- '[SYSTEM_PROMPT]' + system_message + '[/SYSTEM_PROMPT]' }}\n\n{%- for message in loop_messages %}\n    {%- if message['role'] == 'user' %}\n        {{- '[INST]' + message['content'] + '[/INST]' }}\n    {%- elif message['role'] == 'system' %}\n        {{- '[SYSTEM_PROMPT]' + message['content'] + '[/SYSTEM_PROMPT]' }}\n    {%- elif message['role'] == 'assistant' %}\n        {{- message['content'] + eos_token }}\n    {%- else %}\n        {{- raise_exception('Only user, system and assistant roles are supported!') }}\n    {%- endif %}\n{%- endfor %}",
        }
    return {}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-m", "--model", help="model", type=str)
    args = parser.parse_args()

    model, tokenizer = load(
        args.model,
        tokenizer_config=get_tokenizer_config(args.model),
    )

    send("ready")

    while True:
        try:
            line = sys.stdin.readline().strip()
            if not line:
                continue

            data = json.loads(line)
            print(data, flush=True)
            max_tokens = data.get("n_tokens", -1)
            temperature = data.get("temperature", 0.0)
            messages = data.get("messages", [])
            sampler = make_sampler(temp=temperature)
            prompt = tokenizer.apply_chat_template(messages, add_generation_prompt=True)
            for chunk in stream_generate(
                model,
                tokenizer,
                prompt,
                max_tokens=max_tokens,
                sampler=sampler,
            ):
                send("delta", {"content": chunk.text})
                if chunk.finish_reason:
                    send(
                        "info",
                        {
                            "tokens": chunk.generation_tokens,
                            "tps": chunk.generation_tps,
                        },
                    )
            send("end")

        except EOFError:
            break
        except Exception as e:
            send("error", {"content": str(e)})


if __name__ == "__main__":
    main()
