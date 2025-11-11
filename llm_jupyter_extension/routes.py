import json
import os
import requests
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

class HelloRouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": (
                "Hello, world!"
                " This is the '/llm-jupyter-extension/hello' endpoint."
            ),
        }))


class GetLiteLLMTokenRouteHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        lite_llm_token = os.getenv("LITELLM_TOKEN")
        if not lite_llm_token:
            self.finish(json.dumps({
                "status": "error",
                "message": "LITELLM_TOKEN environment variable is not set.",
            }))
            return

        self.finish(json.dumps({
            "status": "success",
            "token": lite_llm_token
        }))


class GitHubTriggerHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json_body()
        owner,repo = body.get("repo").split("/")
        workflow = "build-app-pack.yml" # e.g. "deploy.yml" or ID number
        ref = body.get("branch")

        GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
        if not GITHUB_TOKEN:
            raise ValueError("GITHUB_TOKEN is not set")

        url = f"https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches"

        print(url)
        headers = {
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
        }
        payload = {"ref": ref}

        r = requests.post(url, headers=headers, json=payload)
        if r.status_code == 204:
            self.finish(json.dumps({"status": "success"}))
        else:
            self.set_status(r.status_code)
            self.finish(json.dumps({"status": "failed", "response": r.text}))


def setup_route_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    hello_route_pattern = url_path_join(base_url, "llm-jupyter-extension", "hello")
    github_trigger_route_pattern = url_path_join(base_url, "llm-jupyter-extension","github", "trigger") 
    get_lite_llm_token_route_pattern = url_path_join(base_url, "llm-jupyter-extension","get-liteLLM-token")
    handlers = [(hello_route_pattern, HelloRouteHandler), (github_trigger_route_pattern, GitHubTriggerHandler), (get_lite_llm_token_route_pattern, GetLiteLLMTokenRouteHandler)]

    web_app.add_handlers(host_pattern, handlers)
