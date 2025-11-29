FROM python:3.12.12-alpine3.22


COPY ./src /backend
WORKDIR "/backend"
RUN python3 -m venv venv
RUN ./venv/bin/pip install --upgrade pip
RUN ./venv/bin/pip install -r requirements.txt


CMD ["./venv/bin/python3", "main.py"]