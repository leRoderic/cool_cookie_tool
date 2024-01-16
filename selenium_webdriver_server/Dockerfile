FROM python:3.11.7-bullseye

ENV CHROME_VERSION=120.0.6099.216-1

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub > linux_signing_key.pub
RUN install -D -o root -g root -m 644 linux_signing_key.pub /etc/apt/keyrings/linux_signing_key.pub
RUN sh -c 'echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/linux_signing_key.pub] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'

RUN apt update
RUN apt-get install google-chrome-stable=$CHROME_VERSION -y

RUN addgroup --gid 9299 tma2023
RUN adduser --disabled-login --gecos GECOS --gid 9299 tma2023

WORKDIR /app

COPY /webdrivers/ /app/webdrivers/
COPY /wsgi.py /app/wsgi.py
COPY /ranked_domains.csv /app/ranked_domains.csv
COPY /app.py /app/app.py
COPY /gdpr_compliance_checker.py /app/gdpr_compliance_checker.py
COPY /requirements.txt /app/requirements.txt

RUN chown -R tma2023:tma2023 /app

RUN pip install -r requirements.txt
RUN pip install uwsgi

USER tma2023

CMD ["uwsgi", "--socket", "0.0.0.0:5000", "--protocol=http", "-w", "wsgi:app"]