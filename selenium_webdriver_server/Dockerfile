FROM python:3.11.7-slim-bullseye

ENV CHROMIUM_VERSION=120.0.6099.216-1~deb11u1

RUN apt update
RUN apt-get install chromium=$CHROMIUM_VERSION -y

RUN addgroup --gid 9299 tma2023
RUN adduser --disabled-login --gecos GECOS --gid 9299 tma2023

WORKDIR /app

COPY /webdrivers/ /app/webdrivers/
COPY /wsgi.py /app/wsgi.py
COPY /app.py /app/app.py
COPY /gdpr_compliance_checker.py /app/gdpr_compliance_checker.py
COPY /requirements.txt /app/requirements.txt

RUN chown -R tma2023:tma2023 /app

USER tma2023

RUN pip install -r requirements.txt
RUN pip install uwsgi

ENTRYPOINT ["uwsgi"]
CMD ["--socket", "0.0.0.0:5000", "--protocol=http", "-w", "wsgi:app"]