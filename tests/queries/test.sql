-- SELECT reg.serverId, wss.address, reg.clientId
-- FROM relayer.Registrations reg
-- INNER JOIN relayer.WebSocketServers wss ON wss.id = reg.serverId
-- WHERE reg.clientId = 'd3f5d641-a2af-4d3b-8726-96505d612b33'

DELETE FROM relayer.WebSocketServers;