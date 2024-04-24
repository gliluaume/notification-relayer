#!/bin/bash

[[ -z $SA_PASSWORD ]] && echo 'Please define SA_PASSWORD env var' && exit 1

echo "Start the script to create the DB and user, waiting for server"
/usr/config/configure-db.sh&

echo "Start SQL Server"
/opt/mssql/bin/sqlservr
