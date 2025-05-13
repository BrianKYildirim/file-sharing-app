from app import create_app

from dotenv import load_dotenv
load_dotenv()

app = create_app()


@app.route('/')
def hello_world():
    return 'Hello World!'


if __name__ == '__main__':
    app.run()
