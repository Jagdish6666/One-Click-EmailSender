const net = require('net');

const host = 'smtp-relay.brevo.com';
const port = 587;

console.log(`Connecting to ${host}:${port}...`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.connect(port, host, () => {
    console.log('Connected to SMTP server!');
    socket.write('EHLO client.example.com\r\n');
});

socket.on('data', (data) => {
    console.log('Received: ' + data);
    socket.end();
});

socket.on('timeout', () => {
    console.log('Connection timed out.');
    socket.destroy();
});

socket.on('error', (err) => {
    console.error('Connection error: ' + err.message);
});

socket.on('close', () => {
    console.log('Connection closed');
});
