# Python image ka base version
FROM python:3.11-slim

# Environment variables set karein
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Root folder banaayein
WORKDIR /app

# Requirements file ko copy karein aur dependencies install karein
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Baaki project code copy karein
COPY . /app/

# Port set karein jo Gunicorn use karega (Cyclic isey padhega)
EXPOSE 8000

# Application ko run karne ki command (gunicorn se)
# Django static files collect karein aur phir server chalaayein
CMD python manage.py collectstatic --noinput && gunicorn inventory_backend.wsgi:application --bind 0.0.0.0:8000