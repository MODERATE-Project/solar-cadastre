#!/bin/bash
# Iniciar PostgreSQL
service postgresql start

# Iniciar Tomcat
service tomcat9 start

# Mantener el contenedor en ejecución
tail -f /var/log/tomcat9/catalina.out

su - postgres -c psql