CREATE DATABASE NotificationRelayer;
GO
USE NotificationRelayer
GO

CREATE SCHEMA Relayer;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'WebSocketServers') AND type in (N'U'))
DROP TABLE WebSocketServers;
GO
CREATE TABLE WebSocketServers (
    Id NVARCHAR (30) NOT NULL,
    [Address] NVARCHAR (200) NOT NULL,
    ClientId UNIQUEIDENTIFIER CONSTRAINT [DF_WebSocketServers_ClientId] DEFAULT (newid()) ROWGUIDCOL NOT NULL,
    CONSTRAINT [PK_WebSocketServers_Id] PRIMARY KEY CLUSTERED (Id ASC)
);

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Registrations') AND type in (N'U'))
DROP TABLE Registrations;
GO
CREATE TABLE Registrations (
    ClientId UNIQUEIDENTIFIER ROWGUIDCOL NOT NULL,
    ServerId NVARCHAR (30) NOT NULL,
    CONSTRAINT [PK_Registrations_ClientId] PRIMARY KEY CLUSTERED (ClientId ASC),
    CONSTRAINT [FK_Registrations_ServerId] FOREIGN KEY (ServerId) REFERENCES WebSocketServers (Id)
);
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'PendingNotifications') AND type in (N'U'))
DROP TABLE PendingNotifications;
GO
CREATE TABLE PendingNotifications (
    ClientId UNIQUEIDENTIFIER ROWGUIDCOL NOT NULL,
    [Message] NVARCHAR (500),
    CONSTRAINT [FK_PendingNotifications_ClientId] FOREIGN KEY (ClientId) REFERENCES Registrations (ClientId)
);
GO
