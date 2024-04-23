#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	CREATE DATABASE NotificationRelayer;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "notificationrelayer" <<-EOSQL
	CREATE SCHEMA Relayer;
	SET search_path TO Relayer;

	DROP TABLE IF EXISTS WebSocketServers;
	CREATE TABLE WebSocketServers (
		Id UUID NOT NULL PRIMARY KEY,
		Name VARCHAR(30) NOT NULL UNIQUE,
		Address VARCHAR(200) NOT NULL
	);

	DROP TABLE IF EXISTS Registrations;
	CREATE TABLE Registrations (
		ClientId UUID NOT NULL PRIMARY KEY,
		ServerId UUID NOT NULL,
		CONSTRAINT FK_Registrations_ServerId FOREIGN KEY (ServerId) REFERENCES WebSocketServers (Id)
	);

	DROP TABLE IF EXISTS PendingNotifications;
	CREATE TABLE PendingNotifications (
		ClientId UUID NOT NULL,
		CreationTime timestamp NOT NULL,
		Link VARCHAR(500),
		Message VARCHAR(500),
		CONSTRAINT FK_PendingNotifications_ClientId FOREIGN KEY (ClientId) REFERENCES Registrations (ClientId)
	);
EOSQL
