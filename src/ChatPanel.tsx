import React, { useEffect, useState } from 'react';
import { getLiteLLMToken, triggerGitHubWorkflow } from './request';
import { LITELLM_API_URL, LITELLM_MODEL, SYSTEM_PROMPT } from './constants';
import { Notification } from '@jupyterlab/apputils';

export const ChatPanel = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState('');
  const [liteLlmToken, setLiteLlmToken] = useState<string | null>(null);

  useEffect(() => {
    getLiteLLMToken().then(response => {
      if (response.status !== 'success') {
        console.warn('Failed to retrieve LiteLLM token: ', response);
        Notification.warning(
          'GenAI Chat unavailable. Unable to retrieve LiteLLM token: ' +
            response.message,
          { autoClose: false }
        );
        return;
      }
      setLiteLlmToken(response.token);
    });
  }, []);

  async function sendMessage() {
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    try {
      const resp = await fetch(LITELLM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${liteLlmToken}`
        },
        body: JSON.stringify({
          model: LITELLM_MODEL,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...newMessages]
        })
      });
      const data = await resp.json();
      const reply = data?.choices?.[0]?.message?.content ?? '[no reply]';

      try {
        const parsed = JSON.parse(reply);
        if (parsed.intent === 'register_algorithm' && parsed.ready) {
          console.log('data:', parsed);
          await triggerGitHubWorkflow(parsed.repo, parsed.branch);
          setMessages([
            ...newMessages,
            {
              role: 'assistant',
              content: `Request for registration submitted successfully: ${parsed.repo}@${parsed.branch}`
            }
          ]);
          return;
        }
      } catch (error) {
        console.error('Failed to parse JSON response from LiteLLM: ', error);
      }

      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('LiteLLM error:', error);
    }
  }

  return (
    <div className="p-3 flex flex-col h-full">
      <div className="flex-grow overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === 'user' ? 'text-right' : 'text-left'}
          >
            <div className="inline-block bg-gray-200 rounded p-2">
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          className="flex-grow border rounded p-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button
          className="ml-2 px-3 py-1 rounded bg-blue-500 text-white"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};
