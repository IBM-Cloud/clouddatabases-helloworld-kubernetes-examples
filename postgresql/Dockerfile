FROM python:3.6.8
WORKDIR /usr/src/app
COPY requirements.txt ./
COPY ./dbcert /usr/local/share/ca-certificates/dbcert.crt
RUN update-ca-certificates
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE  8080
CMD ["python", "server.py"]