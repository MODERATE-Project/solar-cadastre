
# Project Documentation

## Introduction

The Solar Cadastre application, developed as part of the European "Moderate" project, is a web-based tool that allows users to assess the potential of their properties for installing photovoltaic cells. By analyzing factors such as location, elevation, and orientation, the application provides insights into each property's suitability for solar panel installation. Currently, it operates using data from Crevillent, Valencia, Spain. However, the application is designed to be adaptable to any other European city, provided that the necessary data for calculations is available.

This document provides a comprehensive guide to setting up, deploying, and running a full-stack application that includes a PostgreSQL database with PostGIS, a Django-based backend, and an Angular frontend. This setup uses an Ubuntu server and includes configurations for production deployment.

## Solution Architecture

The architecture consists of:
1. **Database Layer**: PostgreSQL with PostGIS for spatial data.
2. **Backend**: Python Django application with REST API.
3. **Frontend**: Angular application served over HTTP.

## Prerequisites

To begin, make sure you have:
- An **Ubuntu Server 22.04** instance.
- Basic familiarity with Linux command line operations.

You will need the following software:
- **PostgreSQL** with **PostGIS** extension.
- **GeoServer** for spatial data layer management, using **Tomcat** as a servlet container.
- **Java JDK 21** to support Tomcat.

## Software Installation

### 1. Installing PostgreSQL and PostGIS

**Postgres version**: 14.3

Install PostgreSQL and PostGIS by running:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis
```

After installation, start the PostgreSQL service:
```bash
sudo service postgresql start
```

To access the PostgreSQL prompt:
```bash
sudo -i -u postgres
psql
```

To exit the PostgreSQL prompt, use:
```bash
\q
```

The default PostgreSQL user is **postgres**, and by default, no password is set.

### 2. Installing Java JDK 21 (Required for Tomcat)

To install Java:
```bash
sudo apt install openjdk-21-jdk
```

### 3. Installing Tomcat and Configuring GeoServer

**Tomcat version**: 9.0.89.0

Install Tomcat:
```bash
sudo apt install tomcat9 tomcat9-admin
```

After installation, navigate to the Tomcat configuration file to set up a user:
```bash
sudo nano /etc/tomcat9/tomcat-users.xml
```

Add a user by inserting the following within `<tomcat-users>` tags:
```xml
<user username="admin" password="Moderate2024*" roles="manager-gui,manager-script"/>
```

**Note**: The Tomcat password is stored in plain text in the tomcat-users.xml file. Ensure this file is secured and not exposed publicly.

To access Tomcat, navigate to your server's IP address on port 8080. Log in with the created user and navigate to the "Manage App" section to deploy GeoServer.

## Frontend Installation and Deployment (Angular)

### Required Versions
- **Node.js**: 20.13
- **Angular CLI**: 16.1.8

### 1. Installation

Download the project files, then open a terminal in the project folder and run:
```bash
npm install
```

Once installation completes, you can start the application with:
```bash
npm start
```
Alternatively, use:
```bash
ng serve
```

### 2. Building the Application

To build the Angular project:
```bash
ng build --prod
```

This will create a `dist` folder with the build output. Transfer the contents of this folder to the Apache server for hosting.

## Backend Installation and Deployment (Django)

### Required Versions
- **Python**: 3.10.12
- **Django**: 5.0.6

### 1. Installation

#### Windows
- Download Python 3.10.12 from the official website and install it.
- This will also install **pip**, Python's package manager.

#### Ubuntu Server
Run the following commands to install Python and set up a virtual environment:
```bash
sudo apt update
sudo apt install python3.10
sudo apt install python3-venv python3-pip
```

Navigate to the backend project folder and create a virtual environment:
```bash
python3 -m venv <env_name>
```

Activate the environment:

- **Windows**:
  ```bash
  <env_name>\Scripts\activate
  ```
- **Ubuntu**:
  ```bash
  source <env_name>/bin/activate
  ```

### 2. Installing Required Packages

Inside the virtual environment, install the required packages:
```bash
pip install django django-cors-headers psycopg2 requests pandas pyproj
```

### 3. Running the Application Locally

To run the Django project locally:
```bash
python manage.py runserver
```

## Backend Deployment on Ubuntu Server

To deploy the backend for production, install **gunicorn** inside the virtual environment:
```bash
pip install gunicorn
```

Create a service file for gunicorn:
```bash
sudo nano /etc/systemd/system/gunicorn.service
```

Insert the following configuration, adjusting paths as needed:
```ini
[Unit]
Description=Gunicorn service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/backend/
ExecStart=/opt/backend/<env_name>/bin/gunicorn django_backend.wsgi:application -b 0.0.0.0:8000

[Install]
WantedBy=multi-user.target
```

Enable and start the gunicorn service:
```bash
sudo systemctl enable gunicorn
sudo systemctl start gunicorn
```

## Docker Deployment

The application can also be deployed using Docker. Below are the steps to deploy both the backend and frontend, including an instance of a GeoServer and a PostGIS database.

1. **Install Docker**. Ensure Docker and Docker Compose are installed on your system. If not, follow the official Docker installation guide.

2. **Taskfile**. The Task is a powerful task runner that simplifies the project management commands. It dynamically selects the appropriate Docker Compose file based on the selected environment (development or production). The project includes a `Taskfile.yaml` and to use it, install Task:
    ```bash
    sudo sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
    ```

    Then, run the following command to build and start the Docker containers:
    ```bash
    task start
    ```

    To see the logs of the deployment, run:
    ```bash
    task logs
    ```

    Or to show only logs of a specific service:
    ```bash
    task logs -- frontend backend
    ```

    Also to check the running services and the type of environment deployed, run:
    ```bash
    task status
    ```

    To see the other available commands, run:
    ```bash
    task --list
    ```


3. **Environment Variables**: Ensure the `.env` file is correctly configured with the necessary environment variables for the backend, such as database credentials. An example of an `.env` file is included in `.env.default`. Special mention should be made of the `ENV` variable, which allows you to easily switch between development (`dev`) and production (`prod`) environments without manually selecting the corresponding `docker-compose` file.

    > Set `ENV=dev` or `ENV=prod` in the `.env` file to automatically select the correct Docker Compose file when running the application with Task




4. **Docker compose**. Besides the Taskfile, the services can also be started using Docker Compose with the provided `docker-compose.prod.yaml` and `docker-compose.dev.yaml` files for production and development environments, respectively. For example, the command to start the services in the production environment is:

    ```bash
    docker compose -p moderate-solar-cadastre -f docker-compose.prod.yaml up --build -d
    ```

This will start the PostgreSQL, Django backend, Angular frontend and any other services defined in the `docker-compose.yml` file.

