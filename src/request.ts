import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

/**
 * Call the server extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    'llm-jupyter-extension', // our server extension's API namespace
    endPoint
  );

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error as any);
  }

  let data: any = await response.text();

  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}

export async function triggerGitHubWorkflow(repo: string, branch: string) {
  try {
    await requestAPI<{ status: string }>('github/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, branch })
    });
  } catch (error) {
    console.error('Failed to trigger GitHub workflow', error);
  }
}

export async function getLiteLLMToken() {
  try {
    const response = await requestAPI<any>('get-liteLLM-token', {
      headers: { 'Content-Type': 'application/json' }
    });
    return response;
  } catch (error) {
    return {
      status: 'error',
      message: 'Request to retrieve LiteLLM token failed.'
    };
  }
}
