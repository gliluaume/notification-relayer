-- postgres sql version
CREATE SCHEMA Relayer;
CREATE DATABASE NotificationRelayer;

DROP TABLE IF EXISTS WebSocketServers;
CREATE TABLE WebSocketServers (
    Id VARCHAR(30) NOT NULL PRIMARY KEY,
    Address VARCHAR(200) NOT NULL,
    ClientId uuid NOT NULL
    -- ClientId uuid DEFAULT (gen_random_uuid()) NOT NULL
);

DROP TABLE IF EXISTS Registrations;
CREATE TABLE Registrations (
    ClientId UUID NOT NULL PRIMARY KEY,
    ServerId VARCHAR(30) NOT NULL,
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
