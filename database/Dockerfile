FROM mcr.microsoft.com/mssql/server:2017-latest


ENV ACCEPT_EULA=Y
ENV SA_PASSWORD=StrongPassw0rd
ENV MSSQL_PID=Express

# Create a config directory
RUN mkdir -p /usr/config
WORKDIR /usr/config

# Bundle config source
COPY ./*.sh /usr/config/
COPY ./*.sql /usr/config/

# Grant permissions for to our scripts to be executable
RUN chmod +x /usr/config/*.sh

ENTRYPOINT [ "/bin/bash", "-c", "/usr/config/entrypoint.sh" ]