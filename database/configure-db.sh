#!/bin/bash

# Wait 60 seconds for SQL Server to start up by ensuring that
# calling SQLCMD does not return an error code, which will ensure that sqlcmd is accessible
# and that system and user databases return "0" which means all databases are in an "online" state
# https://docs.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-databases-transact-sql?view=sql-server-2017

DBSTATUS=1
ERRCODE=1
elapsed=0
TIMEOUT=60
PAUSE=1

echo "Waiting for sqlsrvr to be online"
echo "TIMEOUT: $TIMEOUT"
echo "PAUSE: $PAUSE"
sleep 30
while [[ $DBSTATUS -ne 0 ]] && [[ $elapsed -lt $TIMEOUT ]] && [[ $ERRCODE -ne 0 ]]; do
	elapsed=$((elapsed + 1))
	DBSTATUS=$(/opt/mssql-tools/bin/sqlcmd -h -1 -t 1 -U sa -P $SA_PASSWORD -Q "SET NOCOUNT ON; Select SUM(state) from sys.databases")
	ERRCODE=$?
	echo "elapsed $elapsed, sleeping for $PAUSE seconds"
	sleep $PAUSE
done

echo "DBSTATUS: $DBSTATUS"
echo "ERRCODE: $ERRCODE"
if [[ $DBSTATUS -ne 0 ]] || [[ $ERRCODE -ne 0 ]]; then
	if [[ $DBSTATUS -ne 0 ]]; then
		echo "One or more databases are not in an ONLINE state"
	else
		echo "SQL Server took more than $TIMEOUT seconds to start up"
	fi
	exit 1
fi

echo "Launch setup script"
bash ./setup.sh
