import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { ChatPanel } from './ChatPanel';
import React from 'react';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'llm-jupyter-extension:plugin',
  description: 'A MAAP JupyterLab extension for LLM integration.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const content = ReactWidget.create(<ChatPanel />);
    content.id = 'litellm-chat-panel';
    content.title.label = 'Chat';
    content.title.closable = true;
    app.shell.add(content, 'right');
  }
};

export default plugin;
